# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile
# Mantener MainActivity
-keep class com.PuntoDuocApp.app.MainActivity { *; }

# Mantener todas las actividades
-keep class * extends android.app.Activity
-keep class * extends androidx.appcompat.app.AppCompatActivity

# Mantener las clases de Gson
-keep class com.google.gson.** { *; }

# Mantener las clases de Retrofit
-keep class retrofit2.** { *; }

# Mantener las clases de Room
-keep class androidx.room.** { *; }

# Preserve line number information for debugging stack traces.
-keepattributes SourceFile,LineNumberTable

-keep class com.google.zxing.** { *; }
-keep class com.journeyapps.barcodescanner.** { *; }
