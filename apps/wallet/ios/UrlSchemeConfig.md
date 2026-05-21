# iOS URL Scheme Registration

Add the following to your `Info.plist` to handle wallet deep links:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <!-- OID4VCI credential offer -->
      <string>openid-credential-offer</string>
      <!-- OID4VP presentation request -->
      <string>openid4vp</string>
      <!-- HAIP (High Assurance Interoperability Profile) -->
      <string>haip</string>
    </array>
    <key>CFBundleURLName</key>
    <string>com.eudiwallet</string>
  </dict>
</array>

<!-- NFC usage description (required for ISO 18013-5 proximity) -->
<key>NFCReaderUsageDescription</key>
<string>EUDI Wallet uses NFC to present credentials to compatible readers.</string>

<!-- Camera usage description (required for QR scanning) -->
<key>NSCameraUsageDescription</key>
<string>EUDI Wallet uses the camera to scan credential offer QR codes.</string>

<!-- Face ID usage description -->
<key>NSFaceIDUsageDescription</key>
<string>EUDI Wallet uses Face ID to protect your credentials.</string>
```

## Android Intent Filters

In `AndroidManifest.xml`, inside your `<activity>`:

```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="openid-credential-offer" />
</intent-filter>
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="openid4vp" />
</intent-filter>
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="haip" />
</intent-filter>
```
