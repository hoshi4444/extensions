import JSZip from "jszip";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <h1>SVG Downloader</h1>
    <div class="card">
      <p>現在のページからtitleタグを持つSVG要素を検出してダウンロードします</p>
      <p>※ クラス名に "depreated" を含む親要素のSVGは除外されます</p>
      <p>※ ページをスクロールしながらSVGを検索します</p>
      <button id="download-button" type="button">SVGをダウンロード</button>
      <div id="status"></div>
    </div>
  </div>
`;

// ダウンロードボタンのイベントリスナーを設定
const downloadButton =
  document.querySelector<HTMLButtonElement>("#download-button")!;
const statusElement = document.querySelector<HTMLDivElement>("#status")!;

downloadButton.addEventListener("click", async () => {
  statusElement.textContent =
    "SVGを検索中...スクロールしながら検索しています...";

  try {
    // 現在のアクティブなタブを取得
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab.id) {
      throw new Error("アクティブなタブが見つかりません");
    }

    // コンテンツスクリプトにメッセージを送信
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "getSvgs",
    });

    if (!response || !response.svgs || response.svgs.length === 0) {
      statusElement.textContent =
        "ページ内にtitleタグを持つSVGが見つかりませんでした";
      return;
    }

    statusElement.textContent = `${response.svgs.length}個のSVGが見つかりました。ZIPを作成中...`;

    // ZIPファイルを作成
    const zip = new JSZip();

    // タイトルが重複する場合に連番を付ける用のマップ
    const titleCountMap: Record<string, number> = {};

    // SVGをZIPに追加
    response.svgs.forEach(
      (svg: { content: string; filename: string; title: string }) => {
        let finalFilename = svg.filename;

        // 同じタイトルのファイルが既にある場合は連番を付ける
        if (titleCountMap[svg.title]) {
          titleCountMap[svg.title]++;
          const fileNameWithoutExt = svg.filename.replace(".svg", "");
          finalFilename = `${fileNameWithoutExt}_${
            titleCountMap[svg.title]
          }.svg`;
        } else {
          titleCountMap[svg.title] = 1;
        }

        zip.file(finalFilename, svg.content);
      }
    );

    // ZIPを生成してダウンロード
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `svg-download-${timestamp}.zip`;

    // ダウンロード
    chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: true,
    });

    statusElement.textContent = "ダウンロードが開始されました";

    // BlobURLをクリーンアップ
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (error) {
    console.error("エラーが発生しました:", error);
    statusElement.textContent = `エラー: ${
      error instanceof Error ? error.message : "不明なエラー"
    }`;
  }
});
