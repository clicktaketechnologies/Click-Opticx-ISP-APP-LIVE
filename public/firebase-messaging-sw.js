importScripts('https://www.gstatic.com/firebasejs/10.13.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in your app config
firebase.initializeApp({
  apiKey: "AIzaSyC940eEHtHhJiEAROA7DlvaBYgAi4A3e9I",
  authDomain: "ap-click-opticx.firebaseapp.com",
  projectId: "ap-click-opticx",
  messagingSenderId: "1036833166674",
  appId: "1:1036833166674:web:4d794719a6c0cae379968b"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background Message:', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/icon-192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
