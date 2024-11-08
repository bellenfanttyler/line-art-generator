let grayImageData = null;

// Load image and draw it on original and result canvases
document.getElementById("imageLoader").addEventListener("change", function (event) {
  const originalCanvas = document.getElementById("originalCanvas");
  const originalContext = originalCanvas.getContext("2d");
  const resultCanvas = document.getElementById("resultCanvas");
  const resultContext = resultCanvas.getContext("2d");

  const reader = new FileReader();

  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      // Set canvas dimensions to match the image
      originalCanvas.width = img.width;
      originalCanvas.height = img.height;
      resultCanvas.width = img.width;
      resultCanvas.height = img.height;

      // Set the max value for the line spacing slider to the longest edge / 4
      const maxSpacing = Math.floor(Math.max(img.width, img.height) / 10);
      document.getElementById("spacingSlider").max = maxSpacing;

      // Draw the original image on the originalCanvas
      originalContext.drawImage(img, 0, 0, img.width, img.height);

      // Convert to grayscale and store image data globally
      const imageData = originalContext.getImageData(0, 0, img.width, img.height);
      grayImageData = toGrayscale(imageData);

      // Initial line art rendering
      updateLineArt();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(event.target.files[0]);
});

// Convert the image to grayscale
function toGrayscale(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
    data[i] = data[i + 1] = data[i + 2] = gray; // Set R, G, and B to grayscale
  }
  return imageData;
}

// Calculate minimum color width based on spacing
function calculateMinColorWidth(spacing) {
  let minColorWidth = Infinity;
  let minX = null;

  for (let x = 0; x <= 255; x++) {
    const colorWidth = Math.floor((1 - x / 255) * (spacing / 2)) + 1;
    if (colorWidth < minColorWidth) {
      minColorWidth = colorWidth;
      minX = x;
    }
  }

  return { minColorWidth, minX };
}

// Create line art effect
function createLineArt(imageData, spacing, orientation = "vertical", fillValue = "black", noBars = false) {
  const width = imageData.width;
  const height = imageData.height;
  const output = new Uint8ClampedArray(width * height * 4);
  const backgroundColor = fillValue === "white" ? 0 : 255;
  const lineColor = fillValue === "black" ? 0 : 255;

  // Get the minimum bar thickness value from the slider
  const minBarThickness = parseInt(document.getElementById("barThicknessSlider").value, 10);

  // Get the seed value for line offset
  const seed = parseInt(document.getElementById("seedSlider").value, 10);

  // Initialize output array with the background color
  for (let i = 0; i < output.length; i += 4) {
    output[i] = output[i + 1] = output[i + 2] = backgroundColor;
    output[i + 3] = 255;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const grayValue = imageData.data[index];

      // Apply the seed offset to determine where to start drawing lines
      const shouldDrawBar = (orientation === "vertical" && (x + seed) % spacing === 0) ||
                            (orientation === "horizontal" && (y + seed) % spacing === 0);

      // Only draw if the bar meets the seed condition and thickness requirements
      if (shouldDrawBar) {
        const colorWidth = Math.floor((1 - grayValue / 255) * (spacing / 2)) + 1;

        // Only render bars that meet the minimum thickness requirement
        if (colorWidth >= minBarThickness || !noBars) {
          for (let n = 0; n < colorWidth; n++) {
            if (orientation === "vertical") {
              const leftIndex = ((y * width + (x - n)) * 4);
              const rightIndex = ((y * width + (x + n)) * 4);
              if (leftIndex >= 0) output[leftIndex] = output[leftIndex + 1] = output[leftIndex + 2] = lineColor;
              if (rightIndex < output.length) output[rightIndex] = output[rightIndex + 1] = output[rightIndex + 2] = lineColor;
            } else {
              const topIndex = (((y - n) * width + x) * 4);
              const bottomIndex = (((y + n) * width + x) * 4);
              if (topIndex >= 0) output[topIndex] = output[topIndex + 1] = output[topIndex + 2] = lineColor;
              if (bottomIndex < output.length) output[bottomIndex] = output[bottomIndex + 1] = output[bottomIndex + 2] = lineColor;
            }
          }
        }
      }
    }
  }

  return new ImageData(output, width, height);
}




// Update the line art canvas with current settings
function updateLineArt() {
  if (!grayImageData) return; // Ensure the image is loaded

  // Get current control values
  const spacing = parseInt(document.getElementById("spacingSlider").value, 10);
  const orientation = document.getElementById("orientationSelect").value;
  const fillValue = document.getElementById("fillColorSelect").value;
  const noBars = document.getElementById("noBarsCheckbox").checked;

  // Update spacing display value
  document.getElementById("spacingValue").textContent = spacing;

  // Generate line art with current settings
  const resultCanvas = document.getElementById("resultCanvas");
  const resultContext = resultCanvas.getContext("2d");
  const lineArtData = createLineArt(grayImageData, spacing, orientation, fillValue, noBars);

  // Draw the line art onto the result canvas
  resultContext.putImageData(lineArtData, 0, 0);
}

// Event listeners for updating line art when controls change
document.getElementById("spacingSlider").addEventListener("input", () => {
  // Update the displayed spacing value as the slider moves
  document.getElementById("spacingValue").textContent = document.getElementById("spacingSlider").value;
  updateLineArt();
});



// Update the canvas whenever the bar thickness slider changes
document.getElementById("barThicknessSlider").addEventListener("input", () => {
  updateLineArt();
});

document.addEventListener("DOMContentLoaded", function () {
  // Elements
  const spacingSlider = document.getElementById("spacingSlider");
  const seedSlider = document.getElementById("seedSlider");
  const seedValue = document.getElementById("seedValue");

  // Update seedSlider max when spacingSlider changes
  spacingSlider.addEventListener("input", () => {
    const spacing = parseInt(spacingSlider.value, 10);
    seedSlider.max = spacing; // Set seed max to match spacing
    document.getElementById("spacingValue").textContent = spacing;
    updateLineArt();
  });

  // Update canvas when seed slider changes
  seedSlider.addEventListener("input", () => {
    seedValue.textContent = seedSlider.value;
    updateLineArt();
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const scrollableSettings = document.querySelector(".scrollable-settings");
  const scrollWrapper = document.querySelector(".scrollable-settings-wrapper");

  scrollableSettings.addEventListener("scroll", () => {
    if (scrollableSettings.scrollHeight > scrollableSettings.clientHeight) {
      scrollWrapper.classList.add("scrolled");
    } else {
      scrollWrapper.classList.remove("scrolled");
    }
  });
});


// JavaScript to show scroll shadow on the settings section
document.addEventListener("DOMContentLoaded", function () {
  const scrollableSettings = document.querySelector(".scrollable-settings");
  const scrollWrapper = document.querySelector(".scrollable-settings-wrapper");

  scrollableSettings.addEventListener("scroll", () => {
    if (scrollableSettings.scrollHeight > scrollableSettings.clientHeight) {
      scrollWrapper.classList.add("scrolled");
    } else {
      scrollWrapper.classList.remove("scrolled");
    }
  });
});


document.getElementById("downloadButton").addEventListener("click", function () {
  const canvas = document.getElementById("resultCanvas");
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = "line_art.png";
  link.click();
});

document.getElementById("orientationSelect").addEventListener("change", updateLineArt);
document.getElementById("fillColorSelect").addEventListener("change", updateLineArt);
document.getElementById("noBarsCheckbox").addEventListener("change", updateLineArt);

document.addEventListener("DOMContentLoaded", function () {
  const noBarsCheckbox = document.getElementById("noBarsCheckbox");
  const barThicknessSliderContainer = document.getElementById("barThicknessSliderContainer");
  const barThicknessSlider = document.getElementById("barThicknessSlider");
  const barThicknessValue = document.getElementById("barThicknessValue");

  // Function to dynamically set the maximum thickness value for the slider
  function setBarThicknessMax() {
    const maxThickness = calculateMaxThickness(); // Call your existing or custom function
    barThicknessSlider.max = maxThickness;
  }

  // Placeholder function to determine max bar thickness; replace with actual implementation
  function calculateMaxThickness() {
    // Placeholder value; replace with actual calculation logic
    return 10;
  }

  // Show/hide the thickness slider based on the "Hide Thin Bars" checkbox
  noBarsCheckbox.addEventListener("change", function () {
    if (this.checked) {
      barThicknessSliderContainer.style.display = "block"; // Show the slider container
      setBarThicknessMax(); // Set max value when the checkbox is checked
    } else {
      barThicknessSliderContainer.style.display = "none"; // Hide the slider container
    }
  });

  // Update the displayed value of the thickness slider in real-time
  barThicknessSlider.addEventListener("input", function () {
    barThicknessValue.textContent = this.value;
  });
});
