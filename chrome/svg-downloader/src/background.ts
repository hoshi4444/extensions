// バックグラウンドスクリプト
console.log("SVG Downloader: バックグラウンドスクリプトが読み込まれました");

// 拡張機能がインストールされたときのイベントハンドラ
chrome.runtime.onInstalled.addListener(() => {
  console.log("SVG Downloader: 拡張機能がインストールされました");
});

export {};
