# Push Notifications Setup Guide

This guide explains how to set up push notifications for the AITIAN app using Firebase Cloud Messaging (FCM) and Expo Push Service.

## Overview

The push notification system consists of three parts:
1. **Client-side** (React Native app) - Registers device tokens and displays notifications
2. **Firestore** - Stores notification data and device tokens
3. **Cloud Functions** (Backend) - Sends push notifications via FCM/Expo

## Prerequisites

- Firebase project with Blaze plan (for Cloud Functions)
- Expo account and project
- Physical Android/iOS device (simulators don't support push notifications)

## Step 1: Install Dependencies

Already installed via npm:
```bash
npm install expo-notifications expo-device expo-constants
```

## Step 2: Configure Firebase Cloud Messaging (FCM)

### For Android:

1. Go to Firebase Console > Project Settings > Cloud Messaging
2. Under "Firebase Cloud Messaging API (V1)", click "Manage API in Google Cloud Console"
3. Enable the Firebase Cloud Messaging API
4. Generate a new private key for the service account
5. Download the JSON key file and save it securely

### For iOS:

1. Go to Apple Developer Portal
2. Create an App ID with Push Notifications capability
3. Create a push notification certificate (sandbox and production)
4. Upload the certificate to Firebase Console under Project Settings > Cloud Messaging > iOS

## Step 3: Set Up Firebase Cloud Functions

### Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### Initialize Cloud Functions

```bash
cd functions  # Create this directory
firebase init functions
```

Select TypeScript when prompted.

### Install Required Packages

```bash
cd functions
npm install expo-server-sdk firebase-admin firebase-functions
```

### Create the Cloud Function

Create `functions/src/notifications.ts`:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

admin.initializeApp();

const expo = new Expo();

export const sendPushNotification = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const notification = snap.data();
    const { recipientId, title, body, data } = notification;

    try {
      // Get user's push token
      const tokenDoc = await admin
        .firestore()
        .collection('pushTokens')
        .doc(recipientId)
        .get();

      if (!tokenDoc.exists) {
        console.log(`No push token found for user: ${recipientId}`);
        return null;
      }

      const { token } = tokenDoc.data() as { token: string };

      // Validate token
      if (!Expo.isExpoPushToken(token)) {
        console.log(`Invalid Expo push token: ${token}`);
        return null;
      }

      // Create message
      const messages: ExpoPushMessage[] = [
        {
          to: token,
          sound: 'default',
          title,
          body,
          data: data || {},
          priority: 'high',
          channelId: 'default',
        },
      ];

      // Send notification
      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending push notification chunk:', error);
        }
      }

      // Update notification with delivery status
      await snap.ref.update({
        pushSent: true,
        pushTickets: tickets,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return tickets;
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  });

// Handle push receipt checking
export const checkPushReceipts = functions.pubsub
  .schedule('every 15 minutes')
  .onRun(async (context) => {
    // Get all receipts that need checking
    const receiptsSnapshot = await admin
      .firestore()
      .collection('pushReceipts')
      .where('checked', '==', false)
      .limit(100)
      .get();

    const receiptIds = receiptsSnapshot.docs.map((doc) => doc.id);

    if (receiptIds.length === 0) {
      return null;
    }

    // Check receipts with Expo
    const receiptChunks = expo.chunkPushNotificationReceiptIds(receiptIds);

    for (const chunk of receiptChunks) {
      try {
        const receipts = await expo.getPushNotificationReceiptsAsync(chunk);

        for (const [receiptId, receipt] of Object.entries(receipts)) {
          if (receipt.status === 'ok') {
            // Notification delivered successfully
            await admin
              .firestore()
              .collection('pushReceipts')
              .doc(receiptId)
              .update({
                checked: true,
                status: 'delivered',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
          } else if (receipt.status === 'error') {
            // Handle error
            console.error(`Push notification error: ${receipt.message}`);

            await admin
              .firestore()
              .collection('pushReceipts')
              .doc(receiptId)
              .update({
                checked: true,
                status: 'error',
                error: receipt.message,
                details: receipt.details,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });

            // If the token is invalid, remove it
            if (
              receipt.details?.error === 'InvalidCredentials' ||
              receipt.details?.error === 'DeviceNotRegistered'
            ) {
              // Find and remove the invalid token
              const tokensSnapshot = await admin
                .firestore()
                .collection('pushTokens')
                .where('token', '==', receiptId)
                .get();

              for (const doc of tokensSnapshot.docs) {
                await doc.ref.delete();
                console.log(`Removed invalid token for user: ${doc.id}`);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking push receipts:', error);
      }
    }

    return null;
  });
```

### Update index.ts

In `functions/src/index.ts`:

```typescript
export { sendPushNotification, checkPushReceipts } from './notifications';
```

### Deploy Functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

## Step 4: Update Firestore Security Rules

Add to your `firestore.rules`:

```
// Push tokens - only accessible by the token owner
match /pushTokens/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}

// Notifications - accessible by recipient
match /notifications/{notificationId} {
  allow read: if request.auth != null && resource.data.recipientId == request.auth.uid;
  allow create: if request.auth != null;
  allow update: if request.auth != null && resource.data.recipientId == request.auth.uid;
}
```

## Step 5: Configure Environment Variables

Create or update `.env` file in your project root:

```env
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id
```

Get your Expo project ID from:
- Expo Dashboard > Your Project > Project Settings

## Step 6: Test Push Notifications

### 1. Build Development Client

For testing on a physical device, you need a development build:

```bash
eas build --profile development --platform android
# or
eas build --profile development --platform ios
```

### 2. Use the Expo Notifications Tool

1. Go to [Expo Notifications Tool](https://expo.dev/notifications)
2. Enter your Expo push token (get it from the app)
3. Send a test notification

### 3. Test Through the App

1. Create an assignment as a teacher
2. Check if students receive a push notification
3. Grade an assignment and verify the student gets notified

## Usage in the App

### Register for Push Notifications

The `usePushNotifications` hook automatically registers when the user logs in:

```typescript
import { usePushNotifications } from '@/lib/hooks/usePushNotifications';

function App() {
  const { expoPushToken, isLoading, error } = usePushNotifications();
  
  // Token is automatically saved to Firestore
  // Notifications are handled automatically
}
```

### Send Notifications

Use the `useNotificationService` hook:

```typescript
import { useNotificationService } from '@/lib/hooks/useNotificationService';

function AssignmentCreator() {
  const { notifyAssignmentCreated } = useNotificationService();
  
  const createAssignment = async () => {
    // ... create assignment logic
    
    // Notify students
    await notifyAssignmentCreated(
      courseInstanceId,
      studentIds,
      'Math Homework',
      dueDate
    );
  };
}
```

## Notification Types

The app supports these notification types:

1. **assignment_created** - New assignment posted
2. **assignment_due_soon** - Assignment due in 24 hours
3. **assignment_graded** - Assignment has been graded
4. **material_uploaded** - New study material available
5. **announcement** - General announcement
6. **discussion_reply** - Someone replied to your discussion
7. **attendance_marked** - Your attendance was marked

## Troubleshooting

### Notifications not receiving:

1. Check if running on physical device (not emulator)
2. Verify push permissions are granted
3. Check Firebase Functions logs for errors
4. Verify Expo push token is saved in Firestore

### FCM errors:

1. Verify FCM API is enabled in Google Cloud Console
2. Check service account has proper permissions
3. Verify FCM credentials are uploaded to Firebase Console

### iOS specific issues:

1. Ensure Push Notifications capability is enabled in Xcode
2. Check APNs certificates are valid and not expired
3. Verify bundle ID matches Apple Developer Portal

## Security Considerations

1. Never expose FCM server keys in client code
2. Validate notification recipients server-side
3. Rate limit notification sending
4. Remove invalid tokens promptly
5. Use HTTPS for all push notification endpoints

## Additional Resources

- [Expo Push Notifications Docs](https://docs.expo.dev/push-notifications/overview/)
- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Expo Server SDK](https://github.com/expo/expo-server-sdk-node)
