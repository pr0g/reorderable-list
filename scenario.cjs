function delay(milliseconds) {
  let timeoutId;
  const promise = new Promise((resolve) => {
    timeoutId = setTimeout(resolve, milliseconds);
  });

  // Add cleanup capability
  promise.cleanup = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };

  return promise;
}

async function dragListItem(page) {
  // Find the list item
  const listItem = await page.waitForSelector("ul li:first-child");

  // Get bounding box for calculations
  const box = await listItem.boundingBox();

  // Simulate drag
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  // Drag 100px to the right
  await page.mouse.move(box.x + box.width / 2 + 400, box.y + box.height / 2, {
    steps: 10,
  });
  let delayPromise = delay(1000);
  await delayPromise;
  delayPromise.cleanup();
  await page.mouse.up();
}

// initial page load's url
function url() {
  return "http://localhost:5173/blank";
}

// action where you suspect the memory leak might be happening
async function action(page) {
  await page.click('a[href="/"]');
  await dragListItem(page);
}

// how to go back to the state before action
async function back(page) {
  await page.click('a[href="/blank"]');
}

module.exports = { action, back, url };
