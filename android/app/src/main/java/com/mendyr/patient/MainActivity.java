package com.mendyr.patient;

import android.os.Bundle;

import androidx.activity.EdgeToEdge;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Draw behind the status and navigation bars on every Android version (15+ forces it
        // anyway), so the app looks the same everywhere. The web UI pads itself with
        // env(safe-area-inset-*); see capacitor.config.ts → SystemBars.insetsHandling.
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
    }
}
