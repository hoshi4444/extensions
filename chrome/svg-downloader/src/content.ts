// SVGを検出してバックグラウンドスクリプトに送信するコンテンツスクリプト
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getSvgs") {
    // 非同期処理を行うため、sendResponseを後で呼び出すことを示す
    const findSvgsWithScrolling = async () => {
      const svgs: { content: string; filename: string; title: string }[] = [];
      let lastSvgCount = 0;
      let scrollAttempts = 0;
      const maxScrollAttempts = 10; // 最大スクロール回数

      // スクロールしながらSVGを取得する
      while (scrollAttempts < maxScrollAttempts) {
        // 現在の画面に表示されているSVGを取得
        const currentSvgs = collectVisibleSvgs();
        svgs.push(...currentSvgs);

        // 新しいSVGが見つからなければスクロールを停止
        if (svgs.length === lastSvgCount) {
          scrollAttempts++;
        } else {
          lastSvgCount = svgs.length;
          scrollAttempts = 0; // 新しいSVGが見つかったらカウンタをリセット
        }

        // スクロール前の位置を記録
        const oldScrollY = window.scrollY;

        // ページを少しスクロール
        window.scrollBy(0, window.innerHeight * 0.8);

        // スクロール後に新しいコンテンツがロードされるのを待つ
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // スクロール後の位置を確認
        const newScrollY = window.scrollY;

        // スクロール位置が変わっていなければ、これ以上スクロールできないと判断して終了
        if (newScrollY === oldScrollY) {
          console.log("これ以上スクロールできません。SVGの検索を終了します。");
          break;
        }
      }

      // ページの先頭に戻る
      window.scrollTo(0, 0);

      // 重複を削除（同じtitleのSVGが複数回取得される可能性があるため）
      const uniqueSvgs = svgs.filter(
        (svg, index, self) =>
          index ===
          self.findIndex(
            (s) => s.title === svg.title && s.content === svg.content
          )
      );

      return { svgs: uniqueSvgs };
    };

    // SVGを収集する関数
    function collectVisibleSvgs() {
      const svgElements = document.querySelectorAll("svg");
      const result: { content: string; filename: string; title: string }[] = [];

      svgElements.forEach((svg) => {
        // 親要素のクラス名に"depreated"が含まれるSVGは除外
        const parent = svg.parentElement;
        if (
          parent &&
          parent.className &&
          parent.className.includes("depreated")
        ) {
          return;
        }

        // titleタグを持つSVGのみを抽出
        const titleElement = svg.querySelector("title");
        if (!titleElement || !titleElement.textContent) {
          return; // titleが含まれないSVGは除外
        }

        const title = titleElement.textContent.trim();
        // ファイル名に使えない文字を置換
        const safeTitle = title.replace(/[\\/:*?"<>|]/g, "_");

        const svgContent = new XMLSerializer().serializeToString(svg);
        result.push({
          content: svgContent,
          filename: `${safeTitle}.svg`,
          title: title,
        });
      });

      return result;
    }

    // 非同期処理の結果を返す
    findSvgsWithScrolling().then((result) => {
      sendResponse(result);
    });

    return true; // 非同期レスポンスを示す
  }
  return true;
});
