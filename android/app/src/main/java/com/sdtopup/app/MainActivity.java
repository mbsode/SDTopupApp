package com.sdtopup.app;

import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.PorterDuff;
import android.os.Bundle;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
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
    private static final String SITE_URL = "https://sdtopup.com.ng";
    private ProgressBar loadingBar;
    private FrameLayout loadingOverlay;
    private boolean isFirstPageLoad = true;

    private static final String OFFLINE_HTML =
        "<!DOCTYPE html><html><head><meta charset='UTF-8'>" +
        "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
        "<style>" +
        "*{box-sizing:border-box;margin:0;padding:0}" +
        "body{font-family:Arial,sans-serif;min-height:100vh;background:#021A3C;color:#fff;" +
        "display:flex;align-items:center;justify-content:center;padding:24px}" +
        ".wrap{text-align:center;max-width:340px}" +
        ".icon{width:88px;height:88px;border-radius:26px;margin:0 auto 22px;display:flex;" +
        "align-items:center;justify-content:center;" +
        "background:linear-gradient(145deg,#1d6aff,#0891b2);" +
        "box-shadow:0 18px 45px rgba(29,106,255,.32)}" +
        ".icon svg{width:42px;height:42px}" +
        "h1{font-size:22px;font-weight:800;margin-bottom:10px}" +
        "p{color:rgba(255,255,255,.7);font-size:14px;line-height:1.6;margin-bottom:26px}" +
        "button{background:linear-gradient(135deg,#1d6aff,#0891b2);color:#fff;border:none;" +
        "border-radius:16px;padding:14px 32px;font-size:15px;font-weight:700;cursor:pointer;" +
        "box-shadow:0 14px 32px rgba(29,106,255,.26)}" +
        "</style></head><body>" +
        "<div class='wrap'>" +
        "<div class='icon'><svg viewBox='0 0 24 24' fill='none' stroke='#fff' stroke-width='2' " +
        "stroke-linecap='round' stroke-linejoin='round'>" +
        "<path d='M1 9a17 17 0 0 1 22 0M5 12.5a11 11 0 0 1 14 0M8.5 16a6 6 0 0 1 7 0'/>" +
        "<line x1='12' y1='20' x2='12.01' y2='20'/><line x1='1' y1='1' x2='23' y2='23'/></svg></div>" +
        "<h1>You're Offline</h1>" +
        "<p>SD Topup needs an internet connection. Please check your network and try again.</p>" +
        "<button onclick='AndroidRetry.retry()'>Try Again</button>" +
        "</div></body></html>";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setupCookiePersistence();
        setupLoadingBar();
        setupWebViewLoadingListener();
    }

    private void setupCookiePersistence() {
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);

        if (getBridge() != null && getBridge().getWebView() != null) {
            cookieManager.setAcceptThirdPartyCookies(getBridge().getWebView(), true);
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        CookieManager.getInstance().flush();
    }

    @Override
    public void onStop() {
        super.onStop();
        CookieManager.getInstance().flush();
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
        if (getBridge() == null || getBridge().getWebView() == null) return;

        Bridge bridge = getBridge();
        WebView webView = bridge.getWebView();

        webView.addJavascriptInterface(new Object() {
            @android.webkit.JavascriptInterface
            public void retry() {
                runOnUiThread(() -> webView.loadUrl(SITE_URL));
            }
        }, "AndroidRetry");

        bridge.setWebViewClient(new BridgeWebViewClient(bridge) {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);

                if (isFirstPageLoad) {
                    return;
                }

                runOnUiThread(() -> {
                    if (loadingOverlay != null) loadingOverlay.setVisibility(View.VISIBLE);
                });
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);

                isFirstPageLoad = false;

                runOnUiThread(() -> {
                    if (loadingOverlay != null) loadingOverlay.setVisibility(View.GONE);
                });
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);

                if (request.isForMainFrame()) {
                    runOnUiThread(() -> showOfflinePage(view));
                }
            }
        });
    }

    private void showOfflinePage(WebView view) {
        if (loadingOverlay != null) loadingOverlay.setVisibility(View.GONE);
        view.loadDataWithBaseURL(null, OFFLINE_HTML, "text/html", "UTF-8", null);
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