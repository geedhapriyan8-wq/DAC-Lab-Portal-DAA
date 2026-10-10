/* ============================================================
   Topic 05 — Neural Networks via Transfer Learning
   ============================================================ */
window.LAB_DATA = window.LAB_DATA || {};

window.LAB_DATA['topic-05_lab1'] = {
  title:      'Image Classification via Feature Extraction',
  difficulty: 'Hands-on → Intermediate',
  duration:   '75–90 minutes',
  overview:   'In this practical hands-on lab, you will harness modern Transfer Learning to build a high-performance image classifier using a pre-trained Convolutional Neural Network (MobileNetV2 / ResNet). Instead of training millions of parameters from scratch, you will lock (freeze) the pre-trained feature extractor, build a custom classification head on top, extract deep visual embeddings, and train the classifier on a specialized visual recognition dataset.',
  objectives: [
    'Understand the two-phase Transfer Learning paradigm: pre-training vs downstream adaptation',
    'Load a pre-trained MobileNetV2 / ResNet model trained on 1.4M ImageNet images',
    'Freeze all convolutional base weights to preserve low-level and mid-level feature filters',
    'Append a custom classification head: GlobalAveragePooling, Dropout, and Dense projection',
    'Train only the head parameters and monitor convergence speed',
    'Evaluate accuracy, loss, and inference throughput on test images',
  ],
  steps: [
    {
      title: 'Step 1: The Feature Extraction Architecture',
      content: `<p>A pre-trained CNN consists of two functional parts:</p>
<ol>
  <li><strong>Convolutional Base (Feature Extractor):</strong> Stacks of Conv2D, BatchNorm, and Pooling layers that detect low-level primitives (edges, textures) and high-level patterns (shapes, parts).</li>
  <li><strong>Classifier Head:</strong> Dense layers that map high-level visual features to specific class probabilities (e.g. 1,000 ImageNet classes).</li>
</ol>
<p>In <strong>Feature Extraction</strong>, we discard the original 1000-class head, freeze the convolutional backbone (setting <code>trainable = False</code>), and attach a new classification head tailored to our target classes.</p>`,
      code: {
        language: 'python',
        content: `import os
import torch
import torchvision
import torchvision.transforms as transforms
import torch.nn as nn
import torch.optim as optim
from torchvision.models import mobilenet_v2, MobileNet_V2_Weights

# ── 1. Device Configuration ───────────────────────────────────
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Executing on compute device: {device}")

# ── 2. Data Transformations for Pre-trained Backbones ──────────
# Pre-trained models require specific input normalization (ImageNet mean & std)
data_transforms = {
    'train': transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225])
    ]),
    'val': transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225])
    ]),
}

print("Standard ImageNet transform pipeline configured.")`,
      },
    },
    {
      title: 'Step 2: Load Backbone & Freeze Base Weights',
      content: `<p>Load <code>MobileNetV2</code> with pre-trained ImageNet weights. Loop through all backbone parameters and set <code>requires_grad = False</code>. This locks the convolutional filters in place so backpropagation will not alter them.</p>`,
      code: {
        language: 'python',
        content: `# Load pre-trained MobileNetV2 with default weights
weights = MobileNet_V2_Weights.DEFAULT
backbone = mobilenet_v2(weights=weights)

# ── Freeze all base parameters ────────────────────────────────
for param in backbone.features.parameters():
    param.requires_grad = False

total_params = sum(p.numel() for p in backbone.parameters())
trainable_before = sum(p.numel() for p in backbone.parameters() if p.requires_grad)

print(f"Total Backbone Parameters:      {total_params:,}")
print(f"Trainable Parameters (Frozen):  {trainable_before:,}")`,
      },
      warning: 'If you forget to freeze the backbone parameters, the randomly initialized new head will generate massive initial gradients that will corrupt and destroy the pre-trained weights during the first epoch!',
    },
    {
      title: 'Step 3: Construct Custom Classification Head',
      content: `<p>Replace the original 1000-class classifier head with a custom sequence: <code>Dropout(0.2)</code> &rarr; <code>Linear(1280, num_classes)</code>.</p>`,
      code: {
        language: 'python',
        content: `NUM_CLASSES = 3  # Target classes: e.g. [Defect-A, Defect-B, Normal]

# MobileNetV2 classifier head input feature dimension is 1280
in_features = backbone.classifier[1].in_features

# Replace classifier with custom head
backbone.classifier = nn.Sequential(
    nn.Dropout(p=0.2),
    nn.Linear(in_features, NUM_CLASSES)
)

backbone = backbone.to(device)

trainable_params = sum(p.numel() for p in backbone.parameters() if p.requires_grad)
frozen_params = sum(p.numel() for p in backbone.parameters() if not p.requires_grad)

print("=" * 50)
print(f"Frozen Backbone Parameters:     {frozen_params:,}")
print(f"Trainable Head Parameters:      {trainable_params:,}")
print(f"Trainable Ratio:                {trainable_params/total_params*100:.2f}%")
print("=" * 50)`,
      },
    },
    {
      title: 'Step 4: Train Custom Head & Evaluate Performance',
      content: `<p>Compile optimizer (targeting ONLY the trainable head parameters) and loss function. Train the model for 5 epochs and record convergence.</p>`,
      code: {
        language: 'python',
        content: `# Optimize only parameters where requires_grad == True
optimizer = optim.Adam(
    filter(lambda p: p.requires_grad, backbone.parameters()),
    lr=1e-3
)
criterion = nn.CrossEntropyLoss()

# Simulate a synthetic training step
dummy_images = torch.randn(8, 3, 224, 224).to(device)
dummy_labels = torch.tensor([0, 1, 2, 0, 1, 2, 0, 1]).to(device)

backbone.train()
optimizer.zero_grad()
outputs = backbone(dummy_images)
loss = criterion(outputs, dummy_labels)
loss.backward()
optimizer.step()

print(f"Single Training Step Loss: {loss.item():.4f}")
print("Predicted logits shape:   ", outputs.shape)
print("Predicted probabilities:  \\n", torch.softmax(outputs, dim=1).detach().cpu().round(decimals=3))`,
      },
      note: 'Notice how fast each step executes because backpropagation only computes gradients through the top linear layer rather than backpropagating through 50+ convolutional layers.',
    },
  ],
  exercises: [
    'Test replacing MobileNetV2 with ResNet50. Compare the number of trainable head parameters between the two.',
    'Add an extra intermediate Linear(1280, 256) layer with ReLU before the final output layer. Does validation loss decrease?',
    'Save the trained feature extractor model using torch.save(backbone.state_dict(), "model.pth") and check file size.',
  ],
  quiz: [
    {
      question: 'What is the primary concept behind using a pre-trained CNN for feature extraction?',
      options: [
        'It requires training the entire deep convolutional backbone from scratch',
        'It freezes the pre-trained feature extractor layers and trains only a new custom classification head on top',
        'It eliminates all convolutional filters and converts the network to linear regression',
        'It compresses 3D images into 1D text strings',
      ],
    },
    {
      question: 'Why do we freeze the pre-trained convolutional backbone weights during initial feature extraction?',
      options: [
        'To make the model inference slower',
        'To preserve learned visual features (edges, textures) and prevent large initial gradients from destroying pre-trained weights',
        'Because pre-trained models cannot execute backpropagation',
        'To enable automatic SQL dataset loading',
      ],
    },
    {
      question: 'How does feature extraction compare to training a convolutional network from scratch?',
      options: [
        'Feature extraction requires millions of labeled images and weeks of cluster compute',
        'Feature extraction always achieves exactly zero test loss immediately',
        'Feature extraction achieves strong accuracy with significantly fewer labeled samples and a fraction of the compute time',
        'Feature extraction trains until loss reaches zero',
      ],
    },
    {
      question: 'What layer is commonly placed immediately after the frozen convolutional base to reduce spatial dimensions?',
      options: [
        'MaxPool3D with stride 10',
        'A zero-padding layer',
        'GlobalAveragePooling2D, which condenses spatial feature maps into a 1D feature vector',
        'A batch token generator',
      ],
    },
  ],
};

window.LAB_DATA['topic-05_lab2'] = {
  title:      'End-to-End Fine-Tuning of a CNN',
  difficulty: 'Advanced → Deep Dive',
  duration:   '90–105 minutes',
  overview:   'Feature extraction delivers great results quickly, but fine-tuning is required to unlock peak performance. In this hands-on lab, you will perform end-to-end fine-tuning: you will unfreeze the topmost convolutional layers of a pre-trained backbone, configure differential learning rates (very low learning rates for the backbone, higher for the head), and train the entire network end-to-end to specialize deep filters for domain-specific features.',
  objectives: [
    'Understand when and why to transition from Feature Extraction to Fine-Tuning',
    'Unfreeze selected top convolutional blocks of MobileNetV2 while keeping early layers frozen',
    'Configure differential learning rates using PyTorch parameter groups',
    'Apply learning rate warmup and cosine annealing schedules',
    'Implement regularization (Weight Decay, Dropout) to guard against catastrophic overfitting',
    'Compare validation metrics before and after fine-tuning to verify accuracy gains',
  ],
  steps: [
    {
      title: 'Step 1: The Fine-Tuning Strategy',
      content: `<p>Why not unfreeze the entire network immediately?</p>
<ul>
  <li><strong>Early Layers:</strong> Capture universal visual primitives (edges, color gradients, corners). These are universally useful and should stay frozen.</li>
  <li><strong>Top Layers:</strong> Capture complex semantic shapes. By unfreezing the last 2&ndash;3 blocks, the model adapts these high-level representations to your exact domain.</li>
  <li><strong>Learning Rate Rule:</strong> Use a very low learning rate (e.g. <code>1e-5</code>) for unfrozen backbone layers so weights are nudged gently rather than scrambled.</li>
</ul>`,
      code: {
        language: 'python',
        content: `import torch
import torch.nn as nn
import torch.optim as optim
from torchvision.models import mobilenet_v2, MobileNet_V2_Weights

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = mobilenet_v2(weights=MobileNet_V2_Weights.DEFAULT)

# Replace head for 3 classes
NUM_CLASSES = 3
in_features = model.classifier[1].in_features
model.classifier = nn.Sequential(
    nn.Dropout(p=0.3),
    nn.Linear(in_features, NUM_CLASSES)
)
model = model.to(device)

print(f"Total layers in MobileNetV2 features stack: {len(model.features)}")`,
      },
    },
    {
      title: 'Step 2: Unfreezing Selective Top Convolutional Blocks',
      content: `<p>We keep layers 0 to 13 completely frozen, and unfreeze layers 14 to 18 (the top convolutional inverted residual blocks).</p>`,
      code: {
        language: 'python',
        content: `# 1. First freeze all feature layers
for param in model.features.parameters():
    param.requires_grad = False

# 2. Unfreeze top blocks (index 14 and above)
UNFREEZE_FROM_BLOCK = 14
for i in range(UNFREEZE_FROM_BLOCK, len(model.features)):
    for param in model.features[i].parameters():
        param.requires_grad = True

# Verify status across layers
frozen_count = 0
trainable_count = 0
for name, param in model.named_parameters():
    if param.requires_grad:
        trainable_count += param.numel()
    else:
        frozen_count += param.numel()

print(f"Frozen parameters   : {frozen_count:,}")
print(f"Trainable parameters: {trainable_count:,} (Top Conv Blocks + Head)")`,
      },
    },
    {
      title: 'Step 3: Differential Learning Rates via Parameter Groups',
      content: `<p>We assign two distinct learning rates: <code>1e-5</code> for the unfrozen backbone convolutional layers, and <code>1e-3</code> for the newly initialized classification head.</p>`,
      code: {
        language: 'python',
        content: `# Separate parameter groups
backbone_params = []
head_params = []

for name, param in model.named_parameters():
    if not param.requires_grad:
        continue
    if "classifier" in name:
        head_params.append(param)
    else:
        backbone_params.append(param)

optimizer = optim.AdamW([
    {'params': backbone_params, 'lr': 1e-5, 'weight_decay': 1e-2},
    {'params': head_params,     'lr': 1e-3, 'weight_decay': 1e-3}
])

print("Optimizer configured with differential learning rates:")
for i, group in enumerate(optimizer.param_groups):
    param_count = sum(p.numel() for p in group['params'])
    print(f"  Group {i+1}: {param_count:>8,} parameters | LR: {group['lr']}")`,
      },
      warning: 'Using a high learning rate (e.g. 1e-2) on unfrozen backbone layers causes Catastrophic Forgetting, completely destroying the pre-trained knowledge base.',
    },
    {
      title: 'Step 4: Fine-Tuning Execution & Learning Rate Scheduling',
      content: `<p>Implement a Cosine Annealing learning rate scheduler and execute an end-to-end fine-tuning pass.</p>`,
      code: {
        language: 'python',
        content: `from torch.optim.lr_scheduler import CosineAnnealingLR

scheduler = CosineAnnealingLR(optimizer, T_max=10, eta_min=1e-6)
criterion = nn.CrossEntropyLoss()

# Simulate a fine-tuning forward/backward iteration
dummy_batch = torch.randn(8, 3, 224, 224).to(device)
dummy_labels = torch.tensor([1, 2, 0, 1, 0, 2, 1, 0]).to(device)

model.train()
optimizer.zero_grad()
outputs = model(dummy_batch)
loss = criterion(outputs, dummy_labels)
loss.backward()

# Clip gradients to prevent gradient explosion
torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
optimizer.step()
scheduler.step()

print(f"Fine-Tuning Iteration Loss: {loss.item():.4f}")
print("Gradient Norm clipped successfully.")
print("Updated Learning Rates:", [g['lr'] for g in optimizer.param_groups])`,
      },
    },
  ],
  exercises: [
    'Implement Early Stopping: track validation loss across epochs and automatically halt training when loss stops improving for 3 consecutive epochs.',
    'Test unfreezing all layers vs unfreezing only the top 3 blocks. Document the trade-off in training time and GPU memory.',
    'Add CutMix or MixUp data augmentation to the training loop to further regularize fine-tuning.',
  ],
  quiz: [
    {
      question: 'What is the critical distinction between feature extraction and fine-tuning in transfer learning?',
      options: [
        'Fine-tuning requires building a new architecture from scratch without pre-trained weights',
        'Fine-tuning unfreezes a portion of the top pre-trained backbone layers to adapt high-level features jointly with the classification head',
        'Fine-tuning only works on tabular CSV datasets',
        'Fine-tuning permanently locks all gradients in the network',
      ],
    },
    {
      question: 'When unfreezing convolutional layers during fine-tuning, why must a very low learning rate (e.g., 1e-5) be used?',
      options: [
        'To speed up batch compilation on CPUs',
        'Because high learning rates are disallowed by the framework',
        'To prevent "catastrophic forgetting", ensuring small weight updates adapt representations without wiping out general visual knowledge',
        'Because learning rates above 1e-4 trigger memory leaks',
      ],
    },
    {
      question: 'Which layers of a pre-trained CNN are typically unfrozen first during fine-tuning?',
      options: [
        'The very first convolutional layer that detects simple edges and lines',
        'The top (deepest) convolutional blocks that capture domain-specific semantic shapes and object abstractions',
        'The input image normalization layer',
        'None; all layers must be kept frozen forever',
      ],
    },
    {
      question: 'What risk increases significantly when unfreezing more layers of a large pre-trained network on a small target dataset?',
      options: [
        'The model will train too quickly and finish prematurely',
        'Severe overfitting, because the large number of newly trainable parameters can memorize the small training set',
        'The model weights will automatically drop to zero',
        'The loss function will switch from cross-entropy to mean squared error',
      ],
    },
  ],
};
