/* ============================================================
   Topic 04 — Neural Networks from Scratch (Deep Dive)
   ============================================================ */
window.LAB_DATA = window.LAB_DATA || {};

window.LAB_DATA['topic-04_lab1'] = {
  title:      'Constructing the Forward Architecture',
  difficulty: 'Hands-on → Intermediate',
  duration:   '75–90 minutes',
  overview:   'In this intensive practical lab, you will construct the mathematical and computational forward engine of a deep neural network completely from scratch using NumPy. You will build modular Layer classes, implement vectorized tensor operations (dot product, broadcasted bias additions), code differentiable activation functions (ReLU, Sigmoid, Softmax), verify matrix dimension shapes, and execute complete multi-layer forward passes on non-linear datasets.',
  objectives: [
    'Construct an object-oriented Dense (Fully Connected) Layer class using pure NumPy',
    'Implement vectorized forward propagation (Z = X·W + b) with Xavier/He weight initialization',
    'Implement numerically stable activation functions: ReLU, Sigmoid, and Softmax',
    'Assemble a modular MultiLayerPerceptron forward architecture',
    'Trace tensor dimensions across layers to prevent broadcast mismatch bugs',
    'Execute forward inference on synthetic multi-class datasets and interpret probabilities',
  ],
  steps: [
    {
      title: 'Step 1: Tensor Math & Xavier/He Weight Initialization',
      content: `<p>A neural network is a directed computational graph of linear transformations followed by non-linear activations. If weights are initialized too large, activations explode. If too small, signals vanish.</p>
<h4>Weight Initialization Rules</h4>
<ul>
  <li><strong>He (Kaiming) Initialization:</strong> Standard for ReLU activations: $W \sim \mathcal{N}(0, \sqrt{2 / d_{in}})$</li>
  <li><strong>Xavier (Glorot) Initialization:</strong> Standard for Sigmoid/Tanh activations: $W \sim \mathcal{N}(0, \sqrt{1 / d_{in}})$</li>
  <li><strong>Bias Vectors:</strong> Initialized to zeros $\mathbf{b} \in \mathbb{R}^{1 \times d_{out}}$</li>
</ul>`,
      code: {
        language: 'python',
        content: `import numpy as np

# ── Differentiable Activation Functions ─────────────────────────

def relu(Z):
    """Rectified Linear Unit: max(0, Z)"""
    return np.maximum(0, Z)

def sigmoid(Z):
    """Numerically clipped Sigmoid activation"""
    Z_clipped = np.clip(Z, -500, 500)
    return 1.0 / (1.0 + np.exp(-Z_clipped))

def softmax(Z):
    """Numerically stable Softmax for multi-class probabilities"""
    # Subtract max per row to prevent exp overflow
    exp_shifted = np.exp(Z - np.max(Z, axis=1, keepdims=True))
    return exp_shifted / np.sum(exp_shifted, axis=1, keepdims=True)

# Verification tests
test_z = np.array([[-2.0, 0.0, 3.0]])
print("Input Tensor Z:     ", test_z)
print("ReLU(Z):            ", relu(test_z))
print("Sigmoid(Z):         ", sigmoid(test_z).round(4))
print("Softmax(Z) (sum=1): ", softmax(test_z).round(4), "Sum:", softmax(test_z).sum())`,
      },
    },
    {
      title: 'Step 2: Modular Dense Layer Class',
      content: `<p>Build an object-oriented <code>DenseLayer</code> class. Each layer maintains weights $\mathbf{W}$, bias $\mathbf{b}$, caches input $\mathbf{X}$ and pre-activations $\mathbf{Z}$ during the forward pass, and outputs activations $\mathbf{A}$.</p>`,
      code: {
        language: 'python',
        content: `class DenseLayer:
    """A fully-connected neural network layer with explicit forward caching."""
    def __init__(self, in_features, out_features, activation="relu", init_type="he"):
        self.in_features = in_features
        self.out_features = out_features
        self.activation_name = activation
        
        # Weight Initialization
        if init_type == "he":
            self.W = np.random.randn(in_features, out_features) * np.sqrt(2.0 / in_features)
        else: # Xavier
            self.W = np.random.randn(in_features, out_features) * np.sqrt(1.0 / in_features)
            
        self.b = np.zeros((1, out_features))
        
        # Cache containers for backprop
        self.last_input = None
        self.last_Z = None
        self.last_A = None

    def forward(self, X):
        """
        Computes forward pass:
        Z = X * W + b
        A = g(Z)
        """
        self.last_input = X
        self.last_Z = np.dot(X, self.W) + self.b
        
        if self.activation_name == "relu":
            self.last_A = relu(self.last_Z)
        elif self.activation_name == "sigmoid":
            self.last_A = sigmoid(self.last_Z)
        elif self.activation_name == "softmax":
            self.last_A = softmax(self.last_Z)
        elif self.activation_name == "linear":
            self.last_A = self.last_Z
        else:
            raise ValueError(f"Unknown activation: {self.activation_name}")
            
        return self.last_A

    def __repr__(self):
        return f"DenseLayer(in={self.in_features}, out={self.out_features}, act={self.activation_name})"`,
      },
    },
    {
      title: 'Step 3: Multi-Layer Neural Network Architecture',
      content: `<p>Chain individual layers into a sequential neural network class <code>NeuralNetworkArchitecture</code>. It accepts batches of data, passes tensors forward sequentially through each layer, and returns the final predictions.</p>`,
      code: {
        language: 'python',
        content: `class NeuralNetworkArchitecture:
    """Sequential forward-pass architecture container."""
    def __init__(self):
        self.layers = []

    def add(self, layer: DenseLayer):
        if self.layers:
            prev_out = self.layers[-1].out_features
            assert prev_out == layer.in_features, \\
                f"Dimension mismatch! Prev layer out={prev_out}, but new layer in={layer.in_features}"
        self.layers.append(layer)

    def forward(self, X):
        current_input = X
        for i, layer in enumerate(self.layers):
            current_input = layer.forward(current_input)
        return current_input

    def summary(self):
        print("="*55)
        print("         NEURAL NETWORK FORWARD ARCHITECTURE        ")
        print("="*55)
        total_params = 0
        for i, l in enumerate(self.layers):
            params = l.W.size + l.b.size
            total_params += params
            print(f"Layer {i+1}: {l.activation_name.upper():<8} | In: {l.in_features:>3} -> Out: {l.out_features:>3} | Params: {params:>5}")
        print("="*55)
        print(f"Total Trainable Parameters: {total_params}")
        print("="*55)`,
      },
    },
    {
      title: 'Step 4: Dimension Trace & Sanity Check',
      content: `<p>Instantiate a 3-layer architecture (Input: 4 features &rarr; Hidden 1: 16 neurons with ReLU &rarr; Hidden 2: 8 neurons with ReLU &rarr; Output: 3 classes with Softmax).</p>`,
      code: {
        language: 'python',
        content: `np.random.seed(42)

# Build network: 4 inputs -> 16 hidden -> 8 hidden -> 3 outputs
model = NeuralNetworkArchitecture()
model.add(DenseLayer(in_features=4, out_features=16, activation="relu", init_type="he"))
model.add(DenseLayer(in_features=16, out_features=8, activation="relu", init_type="he"))
model.add(DenseLayer(in_features=8, out_features=3, activation="softmax", init_type="xavier"))

model.summary()

# Create dummy mini-batch of 5 samples
batch_X = np.random.randn(5, 4)
output_probs = model.forward(batch_X)

print("\\nForward Pass Execution on Mini-Batch (5 samples, 4 features):")
print("Input Shape: ", batch_X.shape)
print("Output Shape:", output_probs.shape)
print("\\nPredicted Class Probabilities:")
print(output_probs.round(4))
print("\\nRow Sums (Softmax property check):", output_probs.sum(axis=1).round(3))`,
      },
      note: 'Softmax guarantees that the sum of output probabilities for each sample equals exactly 1.0, making it suitable for multi-class classification.',
    },
  ],
  exercises: [
    'Implement a LeakyReLU activation function ($f(z) = z$ if $z > 0$ else $0.01z$) and integrate it into the DenseLayer class.',
    'Add an assertion inside forward() that checks whether input X contains any NaN or Inf values.',
    'Calculate the total parameter count formula for an $L$-layer network by hand and compare with model.summary().',
  ],
  quiz: [
    {
      question: 'What is the primary mathematical purpose of the bias term ($b$) in a perceptron or dense layer?',
      options: [
        'To prevent the network from overfitting to the training data',
        'To shift the activation function, allowing the linear decision boundary to translate away from the origin (0,0)',
        'To scale the input features so they are between 0 and 1',
        'To increase the speed of the dot product computation',
      ],
    },
    {
      question: 'Why does a single layer perceptron completely fail to learn the XOR logical function?',
      options: [
        'Because XOR requires exactly 3 input features, but the perceptron only has 2',
        'Because the standard learning rate is not optimized for XOR',
        'Because the XOR function is not linearly separable (it is impossible to separate the classes with a single hyperplane)',
        'Because XOR requires negative weights, which a perceptron cannot represent',
      ],
    },
    {
      question: 'In the perceptron learning rule (w_new = w_old + alpha * e * x), what happens if the network\'s prediction perfectly matches the target label?',
      options: [
        'The weights are decreased by the learning rate to stabilize the model',
        'The weights are randomized slightly to escape local minima',
        'The error (e) is 0, so the weight update term becomes 0, and the weights remain completely unchanged',
        'The bias is increased to increase confidence',
      ],
    },
    {
      question: 'What is the fatal flaw of the Heaviside Step Function that prevents it from being used in modern deep neural networks?',
      options: [
        'It is too computationally expensive to calculate',
        'It outputs values outside the range of 0 to 1',
        'Its derivative is zero almost everywhere, meaning gradient descent cannot be used to update weights in deeper networks',
        'It cannot handle negative input features',
      ],
    },
  ],
};

window.LAB_DATA['topic-04_lab2'] = {
  title:      'Training and Evaluating the Network',
  difficulty: 'Advanced → Deep Dive',
  duration:   '90–120 minutes',
  overview:   'Now that the forward computational architecture is established, you will implement the core mathematical engine that enables learning: Backpropagation and Gradient Descent. You will derive categorical cross-entropy loss gradients, backpropagate error signals through hidden layers via the chain rule of calculus, update weights with learning rate schedules, and train the network to solve complex non-linear classification problems.',
  objectives: [
    'Implement Categorical Cross-Entropy Loss and One-Hot Encoding utilities from scratch',
    'Derive the analytical output gradient for Softmax + Cross-Entropy: dZ = A - Y',
    'Implement the backward pass through ReLU and Dense layers using the Chain Rule',
    'Write a complete training loop with batch gradient descent and loss tracking',
    'Train the network on non-linear datasets (e.g. XOR and concentric circles)',
    'Compute classification metrics: Accuracy, Loss convergence, and Decision Surface visualization',
  ],
  steps: [
    {
      title: 'Step 1: Loss Functions & Analytical Gradients',
      content: `<p>To measure prediction error for multi-class classification, we use <strong>Categorical Cross-Entropy</strong>:</p>
<p>$$ \mathcal{L} = -\frac{1}{m} \sum_{i=1}^{m} \sum_{k=1}^{K} y_{ik} \log(\hat{y}_{ik}) $$</p>
<p>When combined with a Softmax output layer, the partial derivative with respect to pre-activation $Z_L$ simplifies to:</p>
<p>$$ \frac{\partial \mathcal{L}}{\partial Z_L} = \frac{1}{m} (A_L - Y) $$</p>`,
      code: {
        language: 'python',
        content: `import numpy as np

def one_hot_encode(labels, num_classes):
    """Converts 1D integer class array to one-hot encoded matrix."""
    return np.eye(num_classes)[labels]

def compute_cross_entropy_loss(y_true_onehot, y_pred_probs, eps=1e-12):
    """Numerically stable cross-entropy loss."""
    m = y_true_onehot.shape[0]
    # Clip probabilities to avoid log(0) NaN
    probs_clipped = np.clip(y_pred_probs, eps, 1.0 - eps)
    loss = -np.sum(y_true_onehot * np.log(probs_clipped)) / m
    return float(loss)

# Quick demonstration
y_true = np.array([0, 1, 2])
y_onehot = one_hot_encode(y_true, num_classes=3)
y_pred = np.array([
    [0.85, 0.10, 0.05],
    [0.05, 0.90, 0.05],
    [0.20, 0.10, 0.70]
])
loss = compute_cross_entropy_loss(y_onehot, y_pred)
print(f"Sample Cross-Entropy Loss: {loss:.4f}")`,
      },
    },
    {
      title: 'Step 2: Backward Pass Implementation for Dense Layer',
      content: `<p>We extend our <code>DenseLayer</code> with a <code>backward(dA_or_dZ)</code> method that applies the chain rule to compute gradients for weights $\mathbf{W}$, biases $\mathbf{b}$, and propagates the gradient back to the preceding layer.</p>`,
      code: {
        language: 'python',
        content: `def relu_derivative(Z):
    """Derivative of ReLU: 1 if Z > 0, else 0"""
    return (Z > 0).astype(float)

def sigmoid_derivative(A):
    """Derivative of Sigmoid: A * (1 - A)"""
    return A * (1.0 - A)

class TrainableDenseLayer:
    def __init__(self, in_features, out_features, activation="relu"):
        self.in_features = in_features
        self.out_features = out_features
        self.activation = activation
        
        # He initialization for ReLU, Xavier for Softmax/Sigmoid
        factor = 2.0 if activation == "relu" else 1.0
        self.W = np.random.randn(in_features, out_features) * np.sqrt(factor / in_features)
        self.b = np.zeros((1, out_features))
        
        # Forward cache
        self.X_in = None
        self.Z = None
        self.A = None
        
        # Computed gradients
        self.dW = None
        self.db = None

    def forward(self, X):
        self.X_in = X
        self.Z = np.dot(X, self.W) + self.b
        if self.activation == "relu":
            self.A = np.maximum(0, self.Z)
        elif self.activation == "sigmoid":
            self.A = 1.0 / (1.0 + np.exp(-np.clip(self.Z, -500, 500)))
        elif self.activation == "softmax":
            exp_shifted = np.exp(self.Z - np.max(self.Z, axis=1, keepdims=True))
            self.A = exp_shifted / np.sum(exp_shifted, axis=1, keepdims=True)
        return self.A

    def backward(self, dZ):
        """
        Calculates gradients dW, db, and propagates dX to prior layer.
        dZ has shape (batch_size, out_features)
        """
        m = self.X_in.shape[0]
        self.dW = np.dot(self.X_in.T, dZ) / m
        self.db = np.sum(dZ, axis=0, keepdims=True) / m
        
        # Gradient with respect to inputs of this layer
        dX = np.dot(dZ, self.W.T)
        return dX

    def update(self, lr):
        """Apply gradient descent step."""
        self.W -= lr * self.dW
        self.b -= lr * self.db`,
      },
    },
    {
      title: 'Step 3: End-to-End Deep Network Training Loop',
      content: `<p>Assemble a trainable two-layer network and train it on the non-linear XOR problem (which defeated the single-layer perceptron).</p>`,
      code: {
        language: 'python',
        content: `class TrainableNetwork:
    def __init__(self, hidden_dim=8, lr=0.1):
        self.layer1 = TrainableDenseLayer(in_features=2, out_features=hidden_dim, activation="relu")
        self.layer2 = TrainableDenseLayer(in_features=hidden_dim, out_features=2, activation="softmax")
        self.lr = lr

    def forward(self, X):
        h = self.layer1.forward(X)
        out = self.layer2.forward(h)
        return out

    def backward(self, X, y_onehot):
        m = X.shape[0]
        # 1. Output gradient for Softmax + Cross-Entropy: dZ2 = (A2 - Y)
        dZ2 = self.layer2.A - y_onehot
        
        # 2. Backprop through Layer 2 to get dA1
        dA1 = self.layer2.backward(dZ2)
        
        # 3. Backprop through ReLU activation: dZ1 = dA1 * relu'(Z1)
        dZ1 = dA1 * (self.layer1.Z > 0).astype(float)
        
        # 4. Backprop through Layer 1
        _ = self.layer1.backward(dZ1)

    def step(self):
        self.layer1.update(self.lr)
        self.layer2.update(self.lr)

    def fit(self, X, y, epochs=1000, log_every=200):
        y_onehot = one_hot_encode(y, num_classes=2)
        history = []
        
        for epoch in range(1, epochs + 1):
            preds = self.forward(X)
            loss = compute_cross_entropy_loss(y_onehot, preds)
            history.append(loss)
            
            self.backward(X, y_onehot)
            self.step()
            
            if epoch % log_every == 0 or epoch == epochs:
                acc = np.mean(np.argmax(preds, axis=1) == y)
                print(f"Epoch {epoch:4d}/{epochs} | Loss: {loss:.5f} | Accuracy: {acc*100:.1f}%")
                
        return history`,
      },
    },
    {
      title: 'Step 4: Train on XOR & Verification Checkpoint',
      content: `<p>Train the network on the XOR truth table. Confirm that the hidden layer creates non-linear feature representations that allow 100% accuracy.</p>`,
      code: {
        language: 'python',
        content: `np.random.seed(42)

# XOR Dataset
X_xor = np.array([
    [0.0, 0.0],
    [0.0, 1.0],
    [1.0, 0.0],
    [1.0, 1.0]
])
y_xor = np.array([0, 1, 1, 0])

print("--- Training Multi-Layer Network on XOR Dataset ---")
net = TrainableNetwork(hidden_dim=8, lr=0.5)
history = net.fit(X_xor, y_xor, epochs=800, log_every=200)

# Final evaluation
final_probs = net.forward(X_xor)
final_preds = np.argmax(final_probs, axis=1)

print("\\nFinal Predictions on XOR Truth Table:")
for i in range(len(X_xor)):
    status = "CORRECT ✅" if final_preds[i] == y_xor[i] else "WRONG ❌"
    print(f"Input {X_xor[i]} -> Target: {y_xor[i]} | Pred: {final_preds[i]} ({final_probs[i][final_preds[i]]:.2%}) | {status}")`,
      },
      note: 'Notice how the multi-layer neural network achieves 100% accuracy on XOR because the hidden layer maps the 2D input into a higher-dimensional space where classes are linearly separable.',
    },
  ],
  exercises: [
    'Implement Momentum Optimizer ($v = \\beta v + \\nabla W$) and observe if training reaches convergence in fewer epochs.',
    'Test with learning rates 5.0 (too high) and 0.0001 (too low) and plot the loss trajectory.',
    'Extend the architecture to a 3-layer network and train on the sklearn make_circles dataset.',
  ],
  quiz: [
    {
      question: 'What is the fundamental purpose of the Backpropagation algorithm?',
      options: [
        'To pass the input data forward through the network to generate a prediction',
        'To calculate the gradients of the loss function with respect to every weight in the network by applying the chain rule of calculus',
        'To initialize the weights to optimal random values before training begins',
        'To prevent the network from memorizing the training data (overfitting)',
      ],
    },
    {
      question: 'Why do we absolutely require non-linear activation functions (like Sigmoid or ReLU) in the hidden layers of a neural network?',
      options: [
        'They execute faster on GPU hardware than linear functions',
        'They prevent the weights from growing to infinity during training',
        'Without non-linearities, multiple matrix multiplications mathematically collapse into a single linear layer, making the network completely incapable of learning complex patterns like XOR',
        'They automatically convert the final output into a valid probability distribution',
      ],
    },
    {
      question: 'In the context of backpropagation, if a specific weight is calculated to have a very large gradient (partial derivative), what does that imply?',
      options: [
        'The weight has already reached its optimal, perfect value',
        'Changing that specific weight will have a large, significant impact on the loss, so it should be updated by a larger step',
        'The input feature associated with that weight is irrelevant and should be dropped',
        'The network\'s learning rate has been set too high and needs to be reduced',
      ],
    },
    {
      question: 'What is the "Vanishing Gradient" problem, and which activation function is most notorious for causing it in deep networks?',
      options: [
        'The model forgets older data; caused by ReLU',
        'Gradients become extremely small as they propagate backward through deep layers, causing early layers to stop updating; notoriously caused by the Sigmoid function',
        'The learning rate decreases to exactly zero automatically; caused by the Softmax function',
        'The loss function becomes completely flat and has no gradients; caused by the Tanh function',
      ],
    },
  ],
};
