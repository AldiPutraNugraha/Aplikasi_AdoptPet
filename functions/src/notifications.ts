import * as admin from 'firebase-admin';

export async function sendPushToUser(userId: string, title: string, body: string) {
  const userSnapshot = await admin.firestore().collection('users').doc(userId).get();
  const token = userSnapshot.get('fcmToken');

  if (typeof token !== 'string' || token.trim().length === 0) {
    return false;
  }

  try {
    await admin.messaging().send({
      token,
      notification: {
        title,
        body,
      },
    });

    return true;
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';

    if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
      await userSnapshot.ref.update({
        fcmToken: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return false;
  }
}
