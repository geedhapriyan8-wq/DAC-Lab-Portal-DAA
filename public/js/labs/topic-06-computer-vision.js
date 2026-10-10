/* ============================================================
   Topic 06 — Computer Vision (Deep Dive)
   ============================================================ */
window.LAB_DATA = window.LAB_DATA || {};

window.LAB_DATA['topic-06_lab1'] = {
  title:      'Building a Baseline Image Classifier',
  difficulty: 'Hands-on → Intermediate',
  duration:   '90 minutes',
  overview:   'In this practical hands-on computer vision lab, you will build and train a Convolutional Neural Network (CNN) image classifier from scratch using PyTorch. You will construct data augmentation pipelines, design a convolutional feature extraction backbone (Conv2D -> ReLU -> MaxPool2D), inspect kernel feature maps, implement a training loop with Cross-Entropy Loss, and evaluate classification performance on real image batches.',
  objectives: [
    'Understand image tensor representations: [Batch, Channels, Height, Width]',
    'Build an image data augmentation and normalization pipeline with torchvision',
    'Construct a modular CNN architecture combining Conv2D, BatchNorm, ReLU, MaxPool2D, and Dense layers',
    'Visualize convolutional kernels and feature activation maps',
    'Train the baseline classifier, logging loss and accuracy per epoch',
    'Generate confusion matrices and evaluate precision/recall across visual classes',
  ],
  steps: [
    {
      title: 'Step 1: Image Tensors & Data Augmentation',
      content: `<p>A color image is represented as a 3D tensor of shape $(C, H, W)$ (Channels, Height, Width). To train robust visual models that do not overfit to specific camera angles or lighting, we apply <strong>Data Augmentation</strong> during training.</p>
<h4>Augmentation Strategy</h4>
<ul>
  <li><code>RandomCrop / Resize</code>: Prevents reliance on fixed object locations.</li>
  <li><code>RandomHorizontalFlip</code>: Invariant to left-right orientations.</li>
  <li><code>ColorJitter</code>: Invariant to contrast and brightness fluctuations.</li>
  <li><code>Normalize</code>: Centers pixel values around zero with unit variance.</li>
</ul>`,
      code: {
        language: 'python',
        content: `import torch
import torch.nn as nn
import torch.optim as optim
import torchvision.transforms as transforms
import torchvision.datasets as datasets
from torch.utils.data import DataLoader

# ── 1. Augmentation & Preprocessing Pipeline ──────────────────
train_transforms = transforms.Compose([
    transforms.RandomCrop(32, padding=4),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.ColorJitter(brightness=0.2, contrast=0.2),
    transforms.ToTensor(),
    transforms.Normalize(mean=(0.4914, 0.4822, 0.4465), 
                         std=(0.2023, 0.1994, 0.2010))
])

test_transforms = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize(mean=(0.4914, 0.4822, 0.4465), 
                         std=(0.2023, 0.1994, 0.2010))
])

print("Augmentation pipelines successfully created.")
print("Training transforms: RandomCrop, HorizontalFlip, ColorJitter, Normalize.")`,
      },
    },
    {
      title: 'Step 2: Constructing the Baseline CNN Architecture',
      content: `<p>We design a 2-block Convolutional Neural Network:</p>
<p><code>Input (3x32x32) &rarr; [Conv 3&rarr;32 &rarr; BN &rarr; ReLU &rarr; MaxPool] &rarr; [Conv 32&rarr;64 &rarr; BN &rarr; ReLU &rarr; MaxPool] &rarr; Flatten &rarr; Linear &rarr; Dropout &rarr; Output (10 classes)</code></p>`,
      code: {
        language: 'python',
        content: `class BaselineCNN(nn.Module):
    def __init__(self, num_classes=10):
        super(BaselineCNN, self).__init__()
        
        # Block 1: Conv -> BN -> ReLU -> MaxPool (32x32 -> 16x16)
        self.block1 = nn.Sequential(
            nn.Conv2d(in_channels=3, out_channels=32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2)
        )
        
        # Block 2: Conv -> BN -> ReLU -> MaxPool (16x16 -> 8x8)
        self.block2 = nn.Sequential(
            nn.Conv2d(in_channels=32, out_channels=64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2)
        )
        
        # Dense Classification Head: 64 channels * 8 * 8 = 4096
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(64 * 8 * 8, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(p=0.4),
            nn.Linear(256, num_classes)
        )

    def forward(self, x):
        x = self.block1(x)
        x = self.block2(x)
        logits = self.classifier(x)
        return logits

# Initialize model and inspect parameters
model = BaselineCNN(num_classes=10)
total_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
print(f"Baseline CNN Architecture initialized.")
print(f"Total Trainable Parameters: {total_params:,}")`,
      },
    },
    {
      title: 'Step 3: Training Loop & Loss Tracking',
      content: `<p>Implement a modular training and evaluation loop with Cross-Entropy Loss and Adam optimizer.</p>`,
      code: {
        language: 'python',
        content: `device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = model.to(device)

criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=1e-3, weight_decay=1e-4)

def train_epoch(model, dataloader, criterion, optimizer, device):
    model.train()
    running_loss, correct, total = 0.0, 0, 0
    
    for images, labels in dataloader:
        images, labels = images.to(device), labels.to(device)
        
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item() * images.size(0)
        _, preds = outputs.max(1)
        correct += preds.eq(labels).sum().item()
        total += labels.size(0)
        
    return running_loss / total, correct / total

# Test with synthetic batch of 16 images
dummy_batch = torch.randn(16, 3, 32, 32).to(device)
dummy_labels = torch.randint(0, 10, (16,)).to(device)

model.train()
optimizer.zero_grad()
out = model(dummy_batch)
l = criterion(out, dummy_labels)
l.backward()
optimizer.step()

print(f"Synthetic Batch Step Successful! Loss: {l.item():.4f}")
print(f"Output Logits Shape: {out.shape} ([Batch Size, Num Classes])")`,
      },
    },
    {
      title: 'Step 4: Inference & Confusion Matrix Evaluation',
      content: `<p>Put the model into evaluation mode using <code>model.eval()</code> and compute class predictions on validation data.</p>`,
      code: {
        language: 'python',
        content: `model.eval()
with torch.no_grad():
    val_images = torch.randn(8, 3, 32, 32).to(device)
    raw_logits = model(val_images)
    probabilities = torch.softmax(raw_logits, dim=1)
    predictions = torch.argmax(probabilities, dim=1)

classes = ['airplane', 'automobile', 'bird', 'cat', 'deer', 'dog', 'frog', 'horse', 'ship', 'truck']

print("--- Inference Batch Results ---")
for i in range(len(predictions)):
    pred_idx = predictions[i].item()
    confidence = probabilities[i][pred_idx].item()
    print(f"Image {i+1}: Predicted '{classes[pred_idx]}' (Confidence: {confidence:.2%})")`,
      },
      note: 'Calling model.eval() switches off Dropout and freezes BatchNorm statistics, ensuring deterministic evaluations.',
    },
  ],
  exercises: [
    'Add a third Convolutional Block with 128 channels and observe the change in trainable parameters.',
    'Plot the training and validation accuracy curves over 15 epochs using Matplotlib.',
    'Implement a learning rate scheduler (ReduceLROnPlateau) when validation loss plateaus.',
  ],
  quiz: [
    {
      question: 'Why does a standard color image tensor have 3 channel dimensions (H, W, 3)?',
      options: [
        'Because file format requires 3 header chunks',
        'Because the image is a 3D hologram',
        'Because each pixel represents Red, Green, and Blue intensity values needed to reconstruct full color',
        'Because monitors require 3 distinct video cables',
      ],
    },
    {
      question: 'In a Convolutional Neural Network, what is the role of Max Pooling layers?',
      options: [
        'To increase spatial dimensions and add more trainable parameters',
        'To convert color images to grayscale',
        'To downsample spatial feature maps, reducing computational dimensionality and providing translation invariance',
        'To normalize batch gradients to zero',
      ],
    },
    {
      question: 'In computer vision, what mathematical operation forms the core of a convolutional layer?',
      options: [
        'Matrix inversion of the entire image tensor',
        'Discrete cosine transform compression',
        'Sliding a parameterized kernel over the input tensor, taking element-wise products and summing to generate feature activation maps',
        'Random sorting of pixel coordinates',
      ],
    },
    {
      question: 'What is the effect of applying Data Augmentation (e.g., random flips, rotations, crops) when training an image classifier?',
      options: [
        'It permanently damages original image quality',
        'It exposes the model to diverse variations of the training images, preventing overfitting and improving generalization',
        'It forces the model to memorize exact pixel positions',
        'It increases inference latency during production deployment',
      ],
    },
  ],
};

window.LAB_DATA['topic-06_lab2'] = {
  title:      'Implementing Edge Detection & Basic Object Tracking',
  difficulty: 'Hands-on → Advanced',
  duration:   '90–105 minutes',
  overview:   'In this lab, you will build classical and modern computer vision pipelines using OpenCV. You will implement multi-stage Edge Detection algorithms (Sobel gradients and Canny edge detection with hysteresis thresholding), extract geometric object contours, and construct a real-time object tracking engine that detects moving objects, calculates bounding boxes, and records motion trajectories across consecutive video frames.',
  objectives: [
    'Compute spatial intensity gradients using Sobel and Laplacian differential filters',
    'Implement Canny Edge Detection with Gaussian filtering and dual hysteresis thresholding',
    'Extract object contours using cv2.findContours and compute geometric moments and areas',
    'Build a foreground object tracking pipeline using background subtraction (MOG2)',
    'Calculate bounding boxes, centers of mass (centroids), and velocity vectors',
    'Overlay motion trajectories and status telemetry onto frame buffers',
  ],
  steps: [
    {
      title: 'Step 1: Intensity Gradients & Sobel Edge Filters',
      content: `<p>An edge in an image is a rapid change in pixel intensity. We compute the directional partial derivatives $\frac{\partial I}{\partial x}$ and $\frac{\partial I}{\partial y}$ using <strong>Sobel kernels</strong>:</p>
<p>$$ G_x = \begin{bmatrix} -1 & 0 & 1 \\ -2 & 0 & 2 \\ -1 & 0 & 1 \end{bmatrix} * I, \quad G_y = \begin{bmatrix} -1 & -2 & -1 \\ 0 & 0 & 0 \\ 1 & 2 & 1 \end{bmatrix} * I $$</p>
<p>The total edge gradient magnitude is $G = \sqrt{G_x^2 + G_y^2}$.</p>`,
      code: {
        language: 'python',
        content: `import cv2
import numpy as np
import matplotlib.pyplot as plt

# Generate a synthetic image with geometric objects
frame = np.zeros((300, 400), dtype=np.uint8)
cv2.rectangle(frame, (50, 50), (180, 200), 255, -1)     # Solid rectangle
cv2.circle(frame, (280, 150), 60, 255, -1)              # Solid circle

# Compute Sobel gradients in X and Y directions
sobel_x = cv2.Sobel(frame, cv2.CV_64F, 1, 0, ksize=3)
sobel_y = cv2.Sobel(frame, cv2.CV_64F, 0, 1, ksize=3)

# Gradient magnitude
gradient_mag = np.sqrt(sobel_x**2 + sobel_y**2)
gradient_mag = np.uint8(np.clip(gradient_mag, 0, 255))

print("Sobel Edge Filter calculation complete.")
print(f"Frame resolution: {frame.shape[1]}x{frame.shape[0]}")
print(f"Max gradient intensity: {gradient_mag.max()}")`,
      },
    },
    {
      title: 'Step 2: Canny Edge Detection with Hysteresis',
      content: `<p>The Canny Edge Detector is a 4-stage edge detection algorithm:</p>
<ol>
  <li><strong>Gaussian Blur:</strong> Smooths image to eliminate high-frequency noise.</li>
  <li><strong>Gradient Calculation:</strong> Finds intensity slope and edge direction $\theta$.</li>
  <li><strong>Non-Maximum Suppression:</strong> Thins wide edge ridges down to 1-pixel width.</li>
  <li><strong>Hysteresis Thresholding:</strong> Edges above <code>threshold2</code> are preserved; edges below <code>threshold1</code> are discarded; intermediate pixels are kept only if connected to strong edges.</li>
</ol>`,
      code: {
        language: 'python',
        content: `# Apply Canny edge detection with threshold1=80 and threshold2=180
blurred = cv2.GaussianBlur(frame, (5, 5), 1.4)
edges = cv2.Canny(blurred, threshold1=80, threshold2=180)

print(f"Canny edge map generated. Edge pixel count: {np.count_nonzero(edges)}")`,
      },
    },
    {
      title: 'Step 3: Contour Extraction & Bounding Boxes',
      content: `<p>Given an edge or binary map, <code>cv2.findContours</code> traces closed boundary curves. From each contour, we extract geometric properties: area, perimeter, and bounding boxes.</p>`,
      code: {
        language: 'python',
        content: `contours, hierarchy = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
print(f"Detected {len(contours)} distinct contours.")

# Color frame for visualization
output_frame = cv2.cvtColor(frame, cv2.COLOR_GRAY2BGR)

for i, cnt in enumerate(contours):
    area = cv2.contourArea(cnt)
    perimeter = cv2.arcLength(cnt, True)
    x, y, w, h = cv2.boundingRect(cnt)
    
    # Draw green bounding box
    cv2.rectangle(output_frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
    
    # Compute centroid (center of mass) using moments
    M = cv2.moments(cnt)
    if M["m00"] != 0:
        cx = int(M["m10"] / M["m00"])
        cy = int(M["m01"] / M["m00"])
        cv2.circle(output_frame, (cx, cy), 4, (0, 0, 255), -1)
        
    print(f"Contour {i+1}: Area={area:.1f}px | BBox=[x={x}, y={y}, w={w}, h={h}] | Centroid=({cx}, {cy})")`,
      },
    },
    {
      title: 'Step 4: Real-time Multi-Frame Object Tracker',
      content: `<p>We now simulate a video stream with a moving object. We use a Background Subtractor (<code>MOG2</code>) to isolate moving foreground targets and track their trajectory over time.</p>`,
      code: {
        language: 'python',
        content: `class ObjectTracker:
    def __init__(self, history_len=50):
        self.subtractor = cv2.createBackgroundSubtractorMOG2(history=history_len, varThreshold=25, detectShadows=False)
        self.trajectory = []

    def process_frame(self, frame_bgr):
        # 1. Background subtraction
        fg_mask = self.subtractor.apply(frame_bgr)
        
        # 2. Morphological noise removal
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        clean_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, kernel)
        
        # 3. Find contours of moving foreground
        contours, _ = cv2.findContours(clean_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        tracked_objects = []
        for cnt in contours:
            if cv2.contourArea(cnt) > 200:  # Filter out tiny noise dots
                x, y, w, h = cv2.boundingRect(cnt)
                cx, cy = x + w // 2, y + h // 2
                self.trajectory.append((cx, cy))
                tracked_objects.append({'bbox': (x, y, w, h), 'center': (cx, cy)})
                
        return tracked_objects, clean_mask

# Simulate 10 frames of a moving target
tracker = ObjectTracker()
print("Simulating video tracking pipeline over 10 consecutive frames:")

for frame_idx in range(10):
    simulated_frame = np.zeros((200, 300, 3), dtype=np.uint8)
    # Moving circle from left to right
    center_x = 30 + frame_idx * 22
    cv2.circle(simulated_frame, (center_x, 100), 20, (255, 255, 255), -1)
    
    tracked, mask = tracker.process_frame(simulated_frame)
    if tracked:
        t = tracked[0]
        print(f"Frame {frame_idx+1:02d}: Target Centroid={t['center']} | BBox={t['bbox']}")

print(f"\\nTotal motion trajectory points logged: {len(tracker.trajectory)}")`,
      },
      note: 'In production systems, this tracker can be combined with Kalman Filters to predict positions during visual occlusions.',
    },
  ],
  exercises: [
    'Implement the Hough Circles Transform (cv2.HoughCircles) to detect circular shapes directly without contour bounding boxes.',
    'Add an optical flow calculation (cv2.calcOpticalFlowFarneback) between consecutive frames to estimate velocity vectors.',
    'Save the tracked video frames as an MP4 video using cv2.VideoWriter.',
  ],
  quiz: [
    {
      question: 'How does contour-based object tracking fundamentally differ from pixel-level semantic segmentation?',
      options: [
        'Contours only work on audio data',
        'Contour tracking detects external object boundaries and bounding boxes from binary masks, whereas segmentation classifies every individual pixel in the entire image',
        'Contour tracking requires multi-GPU training',
        'Semantic segmentation cannot locate objects',
      ],
    },
    {
      question: 'In the Canny edge detection algorithm, why are two hysteresis thresholds (low and high) utilized?',
      options: [
        'One threshold is for Red channels, the other is for Blue channels',
        'To adjust the brightness of the output image',
        'Strong edges above high threshold are preserved immediately, while weak edges are kept only if connected to strong edges, filtering out disconnected noise',
        'To compress the edge map into a JPEG file',
      ],
    },
    {
      question: 'What tensor dimension format does PyTorch Computer Vision models typically require for input batches?',
      options: [
        '[Height, Width, Channels]',
        '[Channels, Height, Width]',
        '[Batch Size, Height, Width, Channels]',
        '[Batch Size, Channels, Height, Width] (NCHW format)',
      ],
    },
    {
      question: 'In classical video tracking using background subtraction (e.g. MOG2), how are moving foreground objects isolated?',
      options: [
        'By setting all pixel values to 255',
        'By modeling static background pixels over time and subtracting them from incoming frames to leave moving foreground contours',
        'By retraining the CNN weights every frame',
        'By applying a high-pass frequency filter to the audio stream',
      ],
    },
  ],
};
