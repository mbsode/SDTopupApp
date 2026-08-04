package com.sdtopup.app;

import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.PorterDuff;
import android.os.Bundle;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {

    private long backPressedTime = 0;
    private static final long BACK_PRESS_INTERVAL = 2000; // 2 seconds
    private ProgressBar loadingBar;
    private FrameLayout loadingOverlay;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setupLoadingBar();
        setupWebViewLoadingListener();
    }

    private void setupLoadingBar() {
        loadingBar = new ProgressBar(this, null, android.R.attr.progressBarStyleLarge);
        loadingBar.setIndeterminate(true);

        if (loadingBar.getIndeterminateDrawable() != null) {
            loadingBar.getIndeterminateDrawable().setColorFilter(
                    Color.parseColor("#1D6AFF"), PorterDuff.Mode.SRC_IN);
        }

        FrameLayout.LayoutParams spinnerParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        spinnerParams.gravity = Gravity.CENTER;
        loadingBar.setLayoutParams(spinnerParams);
        loadingBar.setVisibility(View.GONE);

        FrameLayout overlay = new FrameLayout(this);
        overlay.setBackgroundColor(Color.parseColor("#40021A3C"));
        overlay.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        overlay.addView(loadingBar);
        overlay.setVisibility(View.GONE);

        loadingOverlay = overlay;

        addContentView(overlay, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
    }

    private void setupWebViewLoadingListener() {
        if (getBridge() == null) return;

        Bridge bridge = getBridge();

        bridge.setWebViewClient(new BridgeWebViewClient(bridge) {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                runOnUiThread(() -> {
                    if (loadingOverlay != null) loadingOverlay.setVisibility(View.VISIBLE);
                });
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                runOnUiThread(() -> {
                    if (loadingOverlay != null) loadingOverlay.setVisibility(View.GONE);
                });
            }
        });
    }

    @Override
    public void onBackPressed() {
        if (getBridge() != null && getBridge().getWebView() != null && getBridge().getWebView().canGoBack()) {
            getBridge().getWebView().goBack();
            return;
        }

        if (backPressedTime + BACK_PRESS_INTERVAL > System.currentTimeMillis()) {
            super.onBackPressed();
            return;
        }

        backPressedTime = System.currentTimeMillis();
        showStyledToast("Press back again to exit");
    }

    private void showStyledToast(String message) {
        try {
            LayoutInflater inflater = getLayoutInflater();
            ViewGroup root = findViewById(android.R.id.content);
            View layout = inflater.inflate(R.layout.toast_custom, root, false);

            TextView text = layout.findViewById(R.id.toast_text);
            text.setText(message);

            Toast toast = new Toast(getApplicationContext());
            toast.setDuration(Toast.LENGTH_SHORT);
            toast.setView(layout);
            toast.setGravity(Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL, 0, 120);
            toast.show();
        } catch (Exception e) {
            Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
        }
    }
}