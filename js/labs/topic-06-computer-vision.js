/* ============================================================
   Topic 06 — Computer Vision (Deep Dive)
   ============================================================ */
window.LAB_DATA = window.LAB_DATA || {};

window.LAB_DATA['topic-06_lab1'] = {
  title:      'Image Processing, Arrays, and OpenCV Fundamentals',
  difficulty: 'Simple → Intermediate',
  duration:   '90 minutes',
  overview:   'Before passing images into a deep neural network, you must understand exactly how a computer "sees" an image mathematically. In this comprehensive lab, we will dissect images as multi-dimensional NumPy arrays using OpenCV. You will implement color space conversions, tensor slicing, morphological operations, and understand the mathematical convolution operation that powers modern Convolutional Neural Networks (CNNs).',
  objectives: [
    'Understand digital image representation (pixels, channels, bit-depth, resolutions)',
    'Master OpenCV basics (reading, writing, displaying with Matplotlib)',
    'Perform tensor slicing to crop and isolate image regions',
    'Understand and apply Color Space Conversions (BGR, RGB, HSV, Grayscale)',
    'Implement mathematical Convolutions using custom kernels (Blur, Edge Detection, Sharpening)',
    'Apply Morphological Operations (Erosion and Dilation) for noise removal',
  ],
  steps: [
    {
      title: 'The Digital Image: A Matrix of Numbers',
      content: `<p>To a human, an image is a visual scene. To a computer, it is nothing more than a vast grid of numbers (a tensor). A grayscale image is a 2D matrix (height × width). A standard color image is a 3D matrix (height × width × channels).</p>
<h4>Color Channels and Bit Depth</h4>
<p>In standard RGB imagery, there are 3 channels: Red, Green, and Blue. Each pixel in each channel is represented by an 8-bit integer (<code>uint8</code>), meaning its value ranges from 0 (completely dark) to 255 (maximum intensity).</p>`,
      code: {
        language: 'python',
        content: `import cv2
import numpy as np
import matplotlib.pyplot as plt

# ── 1. Creating a Synthetic Image from Scratch ──
# We create a 100x100 pixel image with 3 color channels, initialized to all zeros (black)
# The data type must be uint8 for standard image display
img_synthetic = np.zeros((100, 100, 3), dtype=np.uint8)

# Paint a red square in the top-left (Row 10 to 40, Col 10 to 40)
# Remember: In NumPy, the indexing is [y1:y2, x1:x2, channel]
# Also, Matplotlib expects RGB format. So Channel 0 is Red.
img_synthetic[10:40, 10:40, 0] = 255 

# Paint a green square in the bottom-right
img_synthetic[60:90, 60:90, 1] = 255

# Paint a blue overlapping rectangle
img_synthetic[30:70, 30:70, 2] = 255

print(f"Image Tensor Shape: {img_synthetic.shape} (Height, Width, Channels)")
print(f"Total Pixels: {img_synthetic.shape[0] * img_synthetic.shape[1]}")
print(f"Total Data Points (Numbers): {img_synthetic.size}")
print(f"Data Type: {img_synthetic.dtype}")

# Display using matplotlib
plt.figure(figsize=(4, 4))
plt.imshow(img_synthetic)
plt.title("Synthetic RGB Tensor")
plt.axis('off')
plt.show()`
      }
    },
    {
      title: 'The OpenCV Quirk: BGR vs RGB',
      content: `<p>OpenCV is the most widely used computer vision library in the world (written in optimized C++ with Python bindings). However, it has a famous historical quirk: it loads color images in <strong>BGR (Blue, Green, Red)</strong> format instead of standard RGB.</p>
<p>If you load an image with OpenCV and immediately display it with Matplotlib (which expects RGB), people will look like Smurfs because the red and blue channels are swapped!</p>`,
      code: {
        language: 'python',
        content: `# ── 2. Color Space Conversion ──
# (Assuming we loaded an image using cv2.imread('my_photo.jpg'))
# Since we don't have a real file, we'll create a fake BGR image
img_bgr = np.zeros((100, 100, 3), dtype=np.uint8)
img_bgr[:, :, 0] = 255  # Full Blue in OpenCV

print("Original loaded shape:", img_bgr.shape)

# Convert BGR to RGB so Matplotlib displays it correctly
img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

# Convert to Grayscale (Crucial for algorithms that don't need color, saving 66% memory)
img_gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
print("Grayscale shape:", img_gray.shape, "(Notice the channel dimension is gone!)")

# Convert to HSV (Hue, Saturation, Value)
# HSV is vastly superior to RGB for color tracking because Hue isolates the "color"
# independent of shadows or lighting (Value).
img_hsv = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2HSV)

fig, axs = plt.subplots(1, 3, figsize=(12, 4))
axs[0].imshow(img_bgr)
axs[0].set_title("OpenCV Default (BGR format)\\nLooks blue but plotted as RGB")

axs[1].imshow(img_rgb)
axs[1].set_title("Converted (cv2.COLOR_BGR2RGB)\\nLooks red as intended")

axs[2].imshow(img_gray, cmap='gray')
axs[2].set_title("Grayscale (cv2.COLOR_RGB2GRAY)")

for ax in axs: ax.axis('off')
plt.show()`
      }
    },
    {
      title: 'Image Filtering (The Mathematics of Convolutions)',
      content: `<p>A <strong>Convolution</strong> involves taking a small matrix called a <em>kernel</em> (usually 3x3 or 5x5) and sliding it across the entire image. At every position, you multiply the kernel numbers with the pixel numbers underneath it and sum them up to produce a single new pixel.</p>
<p>By changing the numbers inside the kernel, you can completely change the effect: blurring, sharpening, or finding edges. This mathematical operation is the foundational building block of Convolutional Neural Networks (CNNs).</p>`,
      code: {
        language: 'python',
        content: `# Let's apply standard filters and custom kernels

# 1. Gaussian Blur (removes high-frequency noise)
# The kernel size MUST be odd (e.g., 5, 5) or (15, 15)
img_blurred = cv2.GaussianBlur(img_synthetic, (11, 11), 0)

# 2. Creating a Custom Sharpening Kernel
# Notice the strong positive center and negative surrounding values.
# This mathematically enhances edges and contrast.
sharpen_kernel = np.array([
    [ 0, -1,  0],
    [-1,  5, -1],
    [ 0, -1,  0]
])
# filter2D applies our custom mathematical kernel to the image
img_sharpened = cv2.filter2D(img_synthetic, -1, sharpen_kernel)

# 3. Canny Edge Detection (A multi-stage edge detection algorithm)
# It finds areas of rapid intensity change.
# threshold1 and threshold2 determine how strong an edge must be to be kept.
# It requires a grayscale image!
gray_synthetic = cv2.cvtColor(img_synthetic, cv2.COLOR_RGB2GRAY)
edges = cv2.Canny(gray_synthetic, threshold1=100, threshold2=200)

fig, axs = plt.subplots(1, 4, figsize=(16, 4))
axs[0].imshow(img_synthetic)
axs[0].set_title("Original Image")

axs[1].imshow(img_blurred)
axs[1].set_title("Gaussian Blur (11x11)")

axs[2].imshow(img_sharpened)
axs[2].set_title("Custom Sharpening Filter")

axs[3].imshow(edges, cmap='gray')
axs[3].set_title("Canny Edge Detection")

for ax in axs: ax.axis('off')
plt.tight_layout()
plt.show()`
      }
    },
    {
      title: 'Morphological Operations',
      content: `<p>When you threshold an image (e.g., separating a white object from a black background), you often get "salt and pepper" noise (random white dots) or holes in your object. <strong>Morphological operations</strong> fix this.</p>
<ul>
  <li><strong>Erosion:</strong> Erodes the boundaries of a foreground object (removes white noise dots).</li>
  <li><strong>Dilation:</strong> Enlarges the boundaries (fills in black holes inside white objects).</li>
</ul>`,
      code: {
        language: 'python',
        content: `# Create a noisy binary image (White object on black background)
noisy_img = np.zeros((100, 100), dtype=np.uint8)
noisy_img[20:80, 20:80] = 255 # Main object

# Add some external salt noise
noisy_img[10:15, 10:15] = 255
noisy_img[85:90, 85:90] = 255

# Add some internal pepper noise (holes)
noisy_img[40:50, 40:50] = 0

# Define a structuring element (a 5x5 block of 1s)
morph_kernel = np.ones((5,5), np.uint8)

# 1. Opening: Erosion followed by Dilation. Good for removing EXTERNAL noise.
img_opening = cv2.morphologyEx(noisy_img, cv2.MORPH_OPEN, morph_kernel)

# 2. Closing: Dilation followed by Erosion. Good for removing INTERNAL holes.
img_closing = cv2.morphologyEx(noisy_img, cv2.MORPH_CLOSE, morph_kernel)

fig, axs = plt.subplots(1, 3, figsize=(12, 4))
axs[0].imshow(noisy_img, cmap='gray')
axs[0].set_title("Original Noisy Image")

axs[1].imshow(img_opening, cmap='gray')
axs[1].set_title("Opening (Removes outer dots)")

axs[2].imshow(img_closing, cmap='gray')
axs[2].set_title("Closing (Fills inner holes)")

for ax in axs: ax.axis('off')
plt.show()`
      },
      note: 'Morphological operations are a staple in classic computer vision pipelines for document scanning, license plate recognition, and medical cell counting.'
    }
  ],
  exercises: [
    'Write the NumPy slicing code to crop the center 50x50 pixels of `img_synthetic`.',
    'What happens to an image if you repeatedly apply the Dilation operation 10 times in a row?',
    'Research the HSV color space. Why is the Hue channel represented as a circle (0 to 179 degrees in OpenCV) rather than a linear scale?',
  ],
  quiz: [
    {
      question: 'Why does a standard RGB color image have a shape of (Height, Width, 3)?',
      options: [
        'Because it is a 3D hologram',
        'Because the file format dictates a 3-byte header',
        'Because each pixel requires 3 separate values (Red, Green, Blue intensity) to represent its color',
        'Because the image is displayed on 3 different monitors',
      ],
      answer: 2
    },
    {
      question: 'What is the infamous quirk you must remember when loading images with OpenCV (`cv2.imread`)?',
      options: [
        'It loads images upside down',
        'It converts everything to grayscale automatically',
        'It loads color channels in BGR (Blue-Green-Red) order instead of standard RGB',
        'It deletes the original file from your hard drive',
      ],
      answer: 2
    },
    {
      question: 'In computer vision, what is a "Convolution"?',
      options: [
        'A complex grammatical sentence structure',
        'The process of compressing a JPEG image',
        'A mathematical operation where a small matrix (kernel) slides over the image, multiplying and summing pixels to apply effects like blurring or edge detection',
        'A technique for generating synthetic data using GANs',
      ],
      answer: 2
    },
    {
      question: 'Which morphological operation is best used to fill in small black "holes" inside a solid white object?',
      options: [
        'Erosion',
        'Dilation (or Closing)',
        'Gaussian Blur',
        'Canny Edge Detection',
      ],
      answer: 1
    }
  ]
};

window.LAB_DATA['topic-06_lab2'] = {
  title:      'Deep Computer Vision: Object Detection with PyTorch',
  difficulty: 'Intermediate → Advanced',
  duration:   '120 minutes',
  overview:   'In Lab 1, we used classic mathematics to process images. Now, we will unleash Deep Learning. You will understand the distinction between Image Classification, Semantic Segmentation, and Object Detection. You will load a state-of-the-art Faster R-CNN model using PyTorch, preprocess image tensors, perform inference, parse the complex bounding box outputs, and overlay the predictions back onto the image using OpenCV.',
  objectives: [
    'Differentiate between Classification, Detection, and Segmentation',
    'Load pre-trained deep learning vision models via `torchvision`',
    'Understand tensor dimension requirements (Batch, Channels, Height, Width) [B, C, H, W]',
    'Normalize images according to the specific requirements of the pre-trained model',
    'Extract and filter bounding boxes, confidence scores, and class labels from a model output dictionary',
    'Draw bounding boxes and formatted text overlays using OpenCV',
  ],
  steps: [
    {
      title: 'The Taxonomy of Computer Vision Tasks',
      content: `<p>Before writing code, you must choose the right architecture for your goal:</p>
<ul>
  <li><strong>Image Classification:</strong> "Is this a picture of a dog or a cat?" (Output: 1 label per image). Example: ResNet, VGG.</li>
  <li><strong>Object Detection:</strong> "Where are all the dogs and cats in this picture?" (Output: A list of bounding box coordinates [x_min, y_min, x_max, y_max] and labels). Example: YOLO, Faster R-CNN, SSD.</li>
  <li><strong>Semantic Segmentation:</strong> "Exactly which pixels belong to the dog?" (Output: A mask where every single pixel is classified). Example: U-Net, Mask R-CNN.</li>
</ul>
<p>We will focus on <strong>Object Detection</strong>.</p>`,
      code: {
        language: 'python',
        content: `import torch
import torchvision
from torchvision.models.detection import fasterrcnn_resnet50_fpn, FasterRCNN_ResNet50_FPN_Weights
from torchvision.transforms import functional as F
import cv2
import numpy as np

print(f"PyTorch version: {torch.__version__}")
print(f"Torchvision version: {torchvision.__version__}")
print(f"CUDA Available: {torch.cuda.is_available()}")`
      }
    },
    {
      title: 'Loading the Model and Category Data',
      content: `<p>We will use <strong>Faster R-CNN</strong> with a ResNet-50 backbone. It is highly accurate, though slightly slower than YOLO models. We will load it with weights pre-trained on the COCO (Common Objects in Context) dataset, which recognizes 80 common categories.</p>`,
      code: {
        language: 'python',
        content: `# 1. Define the weights we want (DEFAULT gives the most up-to-date accurate weights)
weights = FasterRCNN_ResNet50_FPN_Weights.DEFAULT

# 2. Load the model architecture and inject the weights
# This will download ~160MB of weights on the first run
model = fasterrcnn_resnet50_fpn(weights=weights)

# CRITICAL: Set the model to Evaluation mode!
# If you forget this, layers like Dropout and BatchNorm will act as if 
# they are still in training mode, ruining your predictions.
model.eval() 

# 3. Get the human-readable category names from the COCO dataset
# The model outputs integer IDs (e.g., 1). We need to know that 1 == 'person'.
categories = weights.meta["categories"]

print(f"Model successfully loaded in eval mode.")
print(f"The model can recognize {len(categories)} distinct classes.")
print("Sample classes (IDs 1-5):", categories[1:6])
# Note: Index 0 is almost always reserved for the '__background__' class`
      }
    },
    {
      title: 'Tensor Preprocessing for PyTorch',
      content: `<p>Deep Learning models do not accept standard OpenCV images directly. They require strict formatting:</p>
<ol>
  <li><strong>Format:</strong> Must be a PyTorch <code>Tensor</code>, not a NumPy array.</li>
  <li><strong>Values:</strong> Pixels must be normalized to floats between <code>0.0</code> and <code>1.0</code> (OpenCV uses <code>0</code> to <code>255</code>).</li>
  <li><strong>Dimensions:</strong> PyTorch expects Channels-First format: <code>[Channels, Height, Width]</code>. OpenCV uses Channels-Last: <code>[Height, Width, Channels]</code>.</li>
  <li><strong>Batching:</strong> The model expects a batch of images, even if you are only predicting one. Shape must be <code>[Batch, Channels, Height, Width]</code> (known as NCHW format).</li>
</ol>`,
      code: {
        language: 'python',
        content: `# Let's create a synthetic image representing a street scene
# In a real app, use: img_np = cv2.cvtColor(cv2.imread("street.jpg"), cv2.COLOR_BGR2RGB)
img_np = np.zeros((400, 600, 3), dtype=np.uint8)
img_np[100:300, 200:400] = [200, 50, 50] # Draw a fake "car" (Red block)
img_np[200:350, 450:500] = [50, 200, 50] # Draw a fake "person" (Green block)

print(f"Original NumPy shape: {img_np.shape} (H, W, C)")

# Torchvision's 'to_tensor' function handles the C-H-W conversion AND the 0-1 normalization!
img_tensor = F.to_tensor(img_np)
print(f"Converted Tensor shape: {img_tensor.shape} (C, H, W)")
print(f"Tensor data range: min {img_tensor.min():.1f}, max {img_tensor.max():.1f}")

# Add the Batch dimension using 'unsqueeze(0)' (adds a dimension at index 0)
batch = img_tensor.unsqueeze(0)
print(f"Final Batch shape ready for model: {batch.shape} (B, C, H, W)")`
      }
    },
    {
      title: 'Inference and Output Parsing',
      content: `<p>Running the neural network is simple. Parsing the output is the hard part. The model outputs a dictionary containing tensors for bounding boxes, class labels, and confidence scores. It outputs <em>hundreds</em> of guesses, most of which are garbage, so we must filter them using a <strong>Confidence Threshold</strong>.</p>`,
      code: {
        language: 'python',
        content: `# Perform inference. torch.no_grad() disables gradient calculation, 
# saving massive amounts of memory and speeding up execution.
with torch.no_grad():
    predictions = model(batch)[0] # Extract the dict for the first image in the batch

print("\\nRaw Prediction Keys:", list(predictions.keys()))

# Extract the tensors and convert them back to NumPy arrays for easy processing
boxes = predictions["boxes"].numpy()    # Shape [N, 4]: [x_min, y_min, x_max, y_max]
scores = predictions["scores"].numpy()  # Shape [N]: Confidence (0.0 to 1.0)
labels = predictions["labels"].numpy()  # Shape [N]: Integer class IDs

print(f"Total raw proposals generated by model: {len(boxes)}")

# --- FILTERING ---
CONFIDENCE_THRESHOLD = 0.50 # Only keep predictions we are 50% sure about

# Create a boolean mask of valid indices
valid_indices = scores > CONFIDENCE_THRESHOLD

# Apply the mask to filter the arrays
valid_boxes = boxes[valid_indices]
valid_scores = scores[valid_indices]
valid_labels = labels[valid_indices]

print(f"\\nFound {len(valid_boxes)} confident objects after filtering.")
for i in range(len(valid_boxes)):
    class_id = valid_labels[i]
    class_name = categories[class_id]
    confidence = valid_scores[i]
    box = valid_boxes[i].astype(int)
    print(f"Object {i+1}: {class_name.upper()} ({confidence*100:.1f}%) at coords {box}")`
      },
      warning: 'Object detection boxes are typically returned in `[x_min, y_min, x_max, y_max]` format (top-left and bottom-right corners). Some models (like YOLO) return `[x_center, y_center, width, height]`. Always read the documentation of the model you are using!'
    },
    {
      title: 'Drawing the Bounding Boxes',
      content: `<p>Finally, we take the raw coordinates and overlay them onto the original NumPy image array using OpenCV's drawing primitives (<code>cv2.rectangle</code> and <code>cv2.putText</code>).</p>`,
      code: {
        language: 'python',
        content: `def draw_detections(img_array, boxes, labels, scores, category_names):
    """Draws bounding boxes and labels on an image array."""
    # Create a copy so we don't modify the original image
    img_draw = img_array.copy()
    
    for i in range(len(boxes)):
        # Extract data for this specific object
        box = boxes[i].astype(int)
        class_name = category_names[labels[i]]
        score = scores[i]
        
        # Coordinates
        x_min, y_min, x_max, y_max = box
        
        # Draw the Rectangle (Color: Green, Thickness: 2)
        cv2.rectangle(img_draw, (x_min, y_min), (x_max, y_max), (0, 255, 0), 2)
        
        # Draw a filled background rectangle for the text to make it readable
        label_text = f"{class_name}: {score:.2f}"
        (text_w, text_h), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        cv2.rectangle(img_draw, (x_min, y_min - text_h - 10), (x_min + text_w, y_min), (0, 255, 0), -1)
        
        # Draw the text label
        cv2.putText(img_draw, label_text, (x_min, y_min - 5), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
                    
    return img_draw

# Since our synthetic image had no real features, a real model wouldn't detect 
# our colored blocks as actual cars/people.
# In a real environment, you would run:
# final_img = draw_detections(img_np, valid_boxes, valid_labels, valid_scores, categories)
# plt.imshow(final_img)
# plt.show()

print("Bounding box drawing function defined and ready for production use.")`
      }
    }
  ],
  exercises: [
    'Write a python snippet to calculate the total Area (in pixels) of a bounding box given `[x_min, y_min, x_max, y_max]`.',
    'What happens if you set the `CONFIDENCE_THRESHOLD` too low (e.g., 0.05)? What happens if you set it too high (e.g., 0.99)? Describe the trade-off between False Positives and False Negatives.',
    'Research "Non-Maximum Suppression (NMS)". Why is it an absolutely critical algorithm used at the very end of object detection pipelines before presenting the final boxes?',
  ],
  quiz: [
    {
      question: 'What is the primary difference between Semantic Segmentation and Object Detection?',
      options: [
        'Segmentation uses RNNs, Detection uses CNNs',
        'Object Detection outputs bounding boxes around distinct objects, while Semantic Segmentation classifies every individual pixel in the image to a class, creating a pixel-perfect mask',
        'Segmentation is only for video, Detection is for still images',
        'Object Detection requires supervised learning, Segmentation does not',
      ],
      answer: 1
    },
    {
      question: 'Why is it critical to call `model.eval()` before performing inference in PyTorch?',
      options: [
        'To speed up the GPU clock frequency',
        'To instruct PyTorch to download the model weights from the internet',
        'To switch off training-specific layers like Dropout and prevent Batch Normalization from updating its running statistics based on your single test image',
        'To automatically resize the image to fit the model',
      ],
      answer: 2
    },
    {
      question: 'What tensor shape format does a PyTorch vision model typically expect for inference?',
      options: [
        '[Height, Width, Channels]',
        '[Channels, Height, Width]',
        '[Batch Size, Height, Width, Channels]',
        '[Batch Size, Channels, Height, Width] (NCHW format)',
      ],
      answer: 3
    },
    {
      question: 'In object detection output, what does the "confidence score" actually represent?',
      options: [
        'The physical size of the bounding box relative to the image',
        'The neural network\'s calculated probability that the bounding box contains the predicted class',
        'The speed of the inference in milliseconds',
        'The depth (Z-axis) of the object in 3D space',
      ],
      answer: 1
    }
  ]
};
