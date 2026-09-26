/* ============================================================
   Topic 04 — Neural Networks from Scratch (Deep Dive)
   ============================================================ */
window.LAB_DATA = window.LAB_DATA || {};

window.LAB_DATA['topic-04_lab1'] = {
  title:      'Building a Perceptron and Deep Math Fundamentals',
  difficulty: 'Simple → Intermediate',
  duration:   '90 minutes',
  overview:   'In this extremely detailed lab, you will dive into the absolute mathematical foundation of all neural networks by building the simplest possible artificial neuron: the Perceptron. You will implement it from scratch in Python using only NumPy. More importantly, we will dissect the calculus and linear algebra that powers these models before moving to deep learning.',
  objectives: [
    'Understand the mathematical model of an artificial neuron in deep detail',
    'Implement the forward pass (dot product + activation) using vectorization',
    'Implement the Perceptron learning rule (weight updates)',
    'Train a perceptron to learn the logical OR and AND operations',
    'Visualize decision boundaries in 2D and 3D space',
    'Analyze why a single perceptron cannot learn the XOR operation (The AI Winter)',
  ],
  steps: [
    {
      title: 'The Anatomy and Mathematics of a Perceptron',
      content: `<p>The perceptron is a mathematical model inspired by biological neurons. It takes multiple inputs, weights them according to their importance, sums them up, adds a bias, and passes the result through an activation function.</p>
<h4>Mathematical Formulation</h4>
<p>Let $\mathbf{x} = [x_1, x_2, \dots, x_n]$ be the input vector and $\mathbf{w} = [w_1, w_2, \dots, w_n]$ be the weight vector. The bias is a scalar $b$.</p>
<p>The pre-activation (weighted sum) $z$ is calculated using the dot product:</p>
<p>$$ z = \sum_{i=1}^{n} w_i x_i + b = \mathbf{w} \cdot \mathbf{x} + b $$</p>
<p>The output $y$ is determined by passing $z$ through a non-linear activation function $f(z)$. For a basic perceptron, this is the Heaviside Step Function:</p>
<p>$$ f(z) = \begin{cases} 1 & \text{if } z \ge 0 \\ 0 & \text{if } z < 0 \end{cases} $$</p>
<h4>Why the Bias?</h4>
<p>Without the bias $b$, the decision boundary (the line separating classes) would be forced to pass exactly through the origin $(0,0)$. The bias acts as a threshold, allowing the activation function to shift left or right, which is critical for learning patterns that don't cross the origin.</p>`,
      code: {
        language: 'python',
        content: `import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Set plotting style for better visuals
sns.set_theme(style="whitegrid")

class SimplePerceptron:
    """A single neuron implemented from absolute scratch."""
    
    def __init__(self, n_inputs, learning_rate=0.1, random_state=42):
        # Initialize weights to small random numbers, bias to 0
        # Setting a random seed ensures reproducibility
        np.random.seed(random_state)
        # We use a normal distribution with mean=0, std=0.01 for initial weights
        self.weights = np.random.randn(n_inputs) * 0.01
        self.bias = 0.0
        self.lr = learning_rate
        
    def step_function(self, z):
        """
        The Heaviside activation function.
        Returns 1 if z >= 0, else 0. Handles arrays via np.where.
        """
        return np.where(z >= 0, 1, 0)
        
    def predict(self, x):
        """
        Forward pass: compute weighted sum and apply activation.
        Vectorized for efficiency.
        """
        # np.dot is the dot product: (w1*x1 + w2*x2 + ...)
        z = np.dot(x, self.weights) + self.bias
        return self.step_function(z)
        
    def __str__(self):
        return f"Perceptron(weights={self.weights.round(4)}, bias={self.bias:.4f}, lr={self.lr})"

# ─── Demonstration ───
print("Initializing a Perceptron with 2 inputs...")
neuron = SimplePerceptron(n_inputs=2)
print("Initial state:")
print(neuron)

# Test a forward pass with a dummy input
x_test = np.array([1.0, 0.5])
prediction = neuron.predict(x_test)
print(f"\\nForward Pass execution:")
print(f"Input: {x_test}")
print(f"Weighted Sum (z): {np.dot(x_test, neuron.weights) + neuron.bias:.4f}")
print(f"Final Prediction: {prediction}")`
      },
      note: 'Notice how we use `np.where` in the step function. While a simple `if/else` works for a single number, `np.where` allows the function to seamlessly process arrays (batches of data) simultaneously, which is crucial for performance.'
    },
    {
      title: 'The Learning Rule (Training the Perceptron)',
      content: `<p>A perceptron learns by comparing its prediction ($\hat{y}$) to the true label ($y$). If it is wrong, it adjusts its weights slightly in the direction that would have made it correct. This is the <strong>Perceptron Learning Rule</strong>.</p>
<h4>The Update Rule</h4>
<p>For each training example, calculate the error: $e = y - \hat{y}$</p>
<ul>
  <li>If $e = 0$ (correct prediction), no changes are made.</li>
  <li>If $e = 1$ (predicted 0, should be 1), weights are increased.</li>
  <li>If $e = -1$ (predicted 1, should be 0), weights are decreased.</li>
</ul>
<p>The weight update formula uses the learning rate $\alpha$:</p>
<p>$$ \mathbf{w_{new}} = \mathbf{w_{old}} + \alpha \cdot e \cdot \mathbf{x} $$</p>
<p>The bias update formula is similar, but without the input term (since the implicit input for bias is always 1):</p>
<p>$$ b_{new} = b_{old} + \alpha \cdot e $$</p>`,
      code: {
        language: 'python',
        content: `class TrainablePerceptron(SimplePerceptron):
    
    def train(self, X, y, epochs=10, verbose=True):
        """
        Train the perceptron using the perceptron learning rule.
        Returns a history of errors per epoch for visualization.
        """
        errors_history = []
        
        for epoch in range(epochs):
            total_error = 0
            
            # Iterate through each sample in the dataset
            for i in range(len(X)):
                x_i = X[i]
                target = y[i]
                
                # 1. Forward pass
                prediction = self.predict(x_i)
                
                # 2. Calculate error
                error = target - prediction
                total_error += abs(error)
                
                # 3. Update weights and bias
                # Notice how the update is proportional to the input x_i
                self.weights += self.lr * error * x_i
                self.bias    += self.lr * error
                
            errors_history.append(total_error)
            
            if verbose:
                print(f"Epoch {epoch+1:02d}/{epochs} - "
                      f"Errors: {total_error} | "
                      f"W: {self.weights.round(3)} | "
                      f"b: {self.bias:.3f}")
            
            # Early stopping: if the model perfectly classifies the dataset, stop training
            if total_error == 0:
                if verbose:
                    print(f"\\n✨ Converged perfectly at epoch {epoch+1}!")
                break
                
        return errors_history

# ─── Training on Logical OR ───
# The OR logic gate outputs 1 if AT LEAST ONE input is 1.
X_or = np.array([
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1]
])
y_or = np.array([0, 1, 1, 1])

print("─── Training Perceptron on Logical OR ───")
p_or = TrainablePerceptron(n_inputs=2, learning_rate=0.1)
history_or = p_or.train(X_or, y_or, epochs=10)

print("\\nTesting learned OR logic:")
for x in X_or:
    print(f"Input: {x} -> Output: {p_or.predict(x)}")`
      }
    },
    {
      title: 'Visualizing the Decision Boundary (2D)',
      content: `<p>Because our inputs are 2-dimensional ($x_1$ and $x_2$), we can plot them on a 2D graph. A perceptron learns a linear decision boundary (a straight line) that separates the positive class from the negative class.</p>
<p>The equation of this boundary line is where the weighted sum equals exactly zero:</p>
<p>$$ w_1x_1 + w_2x_2 + b = 0 $$</p>
<p>Solving for $x_2$ to plot it on a standard Cartesian plane (where $y$-axis is $x_2$):</p>
<p>$$ x_2 = -\frac{w_1}{w_2}x_1 - \frac{b}{w_2} $$</p>`,
      code: {
        language: 'python',
        content: `def plot_decision_boundary(model, X, y, title="Decision Boundary"):
    """
    Visualizes the dataset and the linear decision boundary learned by the model.
    Includes color-coded background regions.
    """
    plt.figure(figsize=(8, 6))
    
    # 1. Plot the background regions (Decision Surface)
    # Create a mesh grid covering the input space
    x_min, x_max = X[:, 0].min() - 0.5, X[:, 0].max() + 0.5
    y_min, y_max = X[:, 1].min() - 0.5, X[:, 1].max() + 0.5
    xx, yy = np.meshgrid(np.arange(x_min, x_max, 0.02),
                         np.arange(y_min, y_max, 0.02))
                         
    # Predict for every point on the grid
    Z = model.predict(np.c_[xx.ravel(), yy.ravel()])
    Z = Z.reshape(xx.shape)
    
    # Draw the contour (background colors)
    plt.contourf(xx, yy, Z, alpha=0.3, cmap='coolwarm')
    
    # 2. Plot the actual data points
    scatter = plt.scatter(X[:, 0], X[:, 1], c=y, cmap='coolwarm', 
                          edgecolors='k', s=150, zorder=3)
    
    # 3. Plot the exact mathematical line
    w1, w2 = model.weights
    b = model.bias
    
    # Avoid division by zero if w2 is extremely small
    if abs(w2) > 1e-5:
        x1_line = np.array([x_min, x_max])
        x2_line = -(w1 * x1_line + b) / w2
        plt.plot(x1_line, x2_line, 'k--', linewidth=2, label='w1*x1 + w2*x2 + b = 0')
    
    plt.xlim(x_min, x_max)
    plt.ylim(y_min, y_max)
    plt.xlabel('Feature 1 (x1)', fontsize=12)
    plt.ylabel('Feature 2 (x2)', fontsize=12)
    plt.title(title, fontsize=14, fontweight='bold')
    plt.legend()
    plt.tight_layout()
    plt.show()

# (In a real Jupyter environment, this displays the plot)
print("Visualization function ready.")
print("The plot would show a red/blue background split by a dashed line, with data points overlaid.")
# plot_decision_boundary(p_or, X_or, y_or, "Perceptron Decision Boundary: Logical OR")`
      }
    },
    {
      title: 'The AI Winter: The XOR Problem',
      content: `<p>A single perceptron can easily learn OR and AND functions because they are <strong>linearly separable</strong>. You can take a ruler and draw a single straight line to separate the 0s from the 1s.</p>
<p>But what about XOR (Exclusive OR)?</p>
<p>XOR logic: Output is 1 if inputs are DIFFERENT (1,0 or 0,1). Output is 0 if inputs are SAME (0,0 or 1,1).</p>
<p>In 1969, Marvin Minsky and Seymour Papert published a book mathematically proving that a single perceptron could never learn XOR. This realization caused funding for neural networks to collapse, leading to the first "AI Winter".</p>`,
      code: {
        language: 'python',
        content: `X_xor = np.array([
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1]
])
y_xor = np.array([0, 1, 1, 0])

print("─── Attempting to Train on Logical XOR ───")
p_xor = TrainablePerceptron(n_inputs=2, learning_rate=0.1)

# We will try to train it for more epochs to see if it eventually learns
history_xor = p_xor.train(X_xor, y_xor, epochs=20, verbose=False)

print("\\nFinal Testing on XOR logic:")
for x in X_xor:
    print(f"Input: {x} -> Output: {p_xor.predict(x)} | Target: {y_xor[(X_xor == x).all(axis=1)][0]}")
    
print(f"\\nFinal Error Count after 20 epochs: {history_xor[-1]}")
print("\\nNotice how the error never reaches 0, no matter how long you train. The perceptron fails to learn XOR.")
print("Why? Because if you plot the XOR points on a graph, it is geometrically impossible to separate the (0,1)/(1,0) points from the (0,0)/(1,1) points using only one straight line.")
print("The solution? We must connect multiple neurons together into layers. We need a Multi-Layer Perceptron (MLP).")`
      }
    },
    {
      title: 'Exploring Other Activation Functions',
      content: `<p>The step function is easy to understand, but it has a massive flaw: its derivative is zero everywhere (except at $z=0$, where it is undefined). This means we cannot use calculus (gradient descent) to train it. Modern deep learning requires differentiable activation functions.</p>`,
      code: {
        language: 'python',
        content: `def sigmoid(z):
    """
    The Sigmoid function.
    Squashes input values into a smooth probability curve between 0 and 1.
    Formula: 1 / (1 + e^-z)
    """
    return 1.0 / (1.0 + np.exp(-z))

def relu(z):
    """
    Rectified Linear Unit (ReLU).
    The most popular activation function for hidden layers in deep learning.
    Formula: max(0, z)
    """
    return np.maximum(0, z)

def tanh(z):
    """
    Hyperbolic Tangent.
    Similar to sigmoid, but squashes values between -1 and 1.
    Formula: (e^z - e^-z) / (e^z + e^-z)
    """
    return np.tanh(z)

# Let's see how they behave on a range of inputs
z_values = np.linspace(-5, 5, 11)
print(f"{'z':>5} | {'Step':>5} | {'Sigmoid':>8} | {'ReLU':>5} | {'Tanh':>8}")
print("-" * 42)
for z in z_values:
    # Notice how sigmoid gracefully curves, while step jumps immediately
    print(f"{z:5.1f} | {int(z>=0):>5} | {sigmoid(z):8.4f} | {relu(z):5.1f} | {tanh(z):8.4f}")`
      },
      note: 'In the next lab module, we will implement these continuous activation functions so we can calculate gradients and use the Backpropagation algorithm to train multi-layer networks.'
    }
  ],
  exercises: [
    'Modify the dataset to train the perceptron on the logical AND operation (Target: 0, 0, 0, 1). Document how many epochs it takes to converge compared to OR.',
    'Change the learning rate to 1.0, and then to 0.001. Observe how the error history changes. What happens when the learning rate is too high? What happens when it is too low?',
    'Mathematical challenge: Given a trained perceptron with weights $w_1 = 0.5, w_2 = 0.5$ and bias $b = -0.7$, calculate by hand the $z$ values and final predictions for the inputs $[0,0]$ and $[1,1]$ using the step function.',
  ],
  quiz: [
    {
      question: 'What is the primary mathematical purpose of the bias term ($b$) in a perceptron?',
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
      question: 'In the perceptron learning rule ($\mathbf{w_{new}} = \mathbf{w_{old}} + \alpha \cdot e \cdot \mathbf{x}$), what happens if the network\'s prediction perfectly matches the target label?',
      options: [
        'The weights are decreased by the learning rate to stabilize the model',
        'The weights are randomized slightly to escape local minima',
        'The error ($e$) is 0, so the weight update term becomes 0, and the weights remain completely unchanged',
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
  title:      'Deep Neural Networks, Backpropagation & Optimizers',
  difficulty: 'Intermediate → Advanced',
  duration:   '120 minutes',
  overview:   'To solve non-linear problems like XOR and handle complex real-world data, we must chain multiple neurons into layers to form a Multi-Layer Perceptron (MLP). In this highly advanced lab, you will write a complete 2-layer neural network from scratch using NumPy. You will implement the Forward Pass, compute Loss, and derive the complex calculus of the Backpropagation algorithm. Finally, you will explore advanced Optimization strategies.',
  objectives: [
    'Understand the architecture of a deep feedforward neural network',
    'Implement non-linear activation functions (Sigmoid, ReLU) and their exact mathematical derivatives',
    'Write a batched forward pass through multiple layers using matrix multiplication',
    'Implement Backpropagation (the Chain Rule) to calculate weight gradients',
    'Understand the Mean Squared Error (MSE) loss landscape',
    'Train the network using Gradient Descent to successfully solve the XOR problem',
  ],
  steps: [
    {
      title: 'Network Architecture and Activation Derivatives',
      content: `<p>We are building a Multi-Layer Perceptron (MLP) with 1 hidden layer. The architecture is:<br>
<code>Input Layer (2 neurons) -> Hidden Layer (4 neurons) -> Output Layer (1 neuron)</code></p>
<p>To train this network via gradient descent, every operation must be differentiable. We must define both our activation functions AND their derivatives (the slope of the function at a given point).</p>`,
      code: {
        language: 'python',
        content: `import numpy as np
import matplotlib.pyplot as plt

np.random.seed(42)

# ── Activation Functions and their Derivatives ─────────────────

def sigmoid(z):
    """Sigmoid activation: maps inputs to a smooth curve between (0, 1)."""
    # np.clip prevents overflow errors if z is extremely large negative
    z = np.clip(z, -500, 500)
    return 1.0 / (1.0 + np.exp(-z))

def sigmoid_derivative(a):
    """
    Derivative of the sigmoid function.
    CRITICAL NOTE: This function expects the ACTIVATED value (a = sigmoid(z)), 
    not the raw pre-activation z.
    The mathematical derivative of sigmoid(z) is sigmoid(z) * (1 - sigmoid(z)).
    """
    return a * (1.0 - a)

def relu(z):
    """Rectified Linear Unit (ReLU). Standard for hidden layers."""
    return np.maximum(0, z)

def relu_derivative(z):
    """
    Derivative of ReLU. 
    Slope is 1 if z > 0, and 0 if z <= 0.
    """
    return (z > 0).astype(float)

print("Differentiable Activation functions and their gradients are ready.")`
      },
      note: 'Calculating derivatives analytically (like `a * (1-a)`) is vastly faster than calculating them numerically using limits, which is why we hardcode the derivative functions.'
    },
    {
      title: 'Initializing the Deep Network and the Forward Pass',
      content: `<p>The forward pass propagates a batch of data through the network using matrix multiplication. For a batch of inputs $\mathbf{X}$:</p>
<ol>
  <li><strong>Hidden Layer Linear:</strong> $\mathbf{Z_1} = \mathbf{X} \cdot \mathbf{W_1} + \mathbf{b_1}$</li>
  <li><strong>Hidden Layer Activation:</strong> $\mathbf{A_1} = \text{Sigmoid}(\mathbf{Z_1})$</li>
  <li><strong>Output Layer Linear:</strong> $\mathbf{Z_2} = \mathbf{A_1} \cdot \mathbf{W_2} + \mathbf{b_2}$</li>
  <li><strong>Output Layer Activation:</strong> $\mathbf{A_2} = \text{Sigmoid}(\mathbf{Z_2})$ (Final Prediction)</li>
</ol>
<p><em>Note: We use Sigmoid for the hidden layer here to keep the backprop math unified for educational purposes, though ReLU is better in practice.</em></p>`,
      code: {
        language: 'python',
        content: `class DeepNeuralNetwork:
    """A 2-layer neural network (1 hidden layer, 1 output layer)."""
    
    def __init__(self, input_size, hidden_size, output_size, learning_rate=0.1):
        self.lr = learning_rate
        
        # ── Weight Initialization ──
        # We use Xavier/Glorot initialization here. Random normal scaled by variance.
        # This prevents activations from becoming too large or too small (vanishing gradients)
        self.W1 = np.random.randn(input_size, hidden_size) * np.sqrt(2. / input_size)
        self.b1 = np.zeros((1, hidden_size))
        
        self.W2 = np.random.randn(hidden_size, output_size) * np.sqrt(2. / hidden_size)
        self.b2 = np.zeros((1, output_size))
        
    def forward(self, X):
        """Perform a batched forward pass."""
        # Store intermediate values (Z and A) in the object instance.
        # We MUST save these because they are required during the backward pass!
        
        # Layer 1
        self.Z1 = np.dot(X, self.W1) + self.b1
        self.A1 = sigmoid(self.Z1) 
        
        # Layer 2
        self.Z2 = np.dot(self.A1, self.W2) + self.b2
        self.A2 = sigmoid(self.Z2)
        
        return self.A2
        
    def compute_loss(self, y_true, y_pred):
        """Mean Squared Error (MSE) loss function."""
        # Note: In classification, Cross-Entropy is mathematically superior,
        # but MSE is easier to differentiate by hand for beginners.
        return np.mean(np.square(y_true - y_pred))

# Let's trace the matrix dimensions
nn = DeepNeuralNetwork(input_size=2, hidden_size=4, output_size=1)
dummy_batch = np.array([[0, 1], [1, 1], [0, 0]]) # Batch of 3 samples

out = nn.forward(dummy_batch)
print("Forward Pass Trace:")
print(f"Input X shape:  {dummy_batch.shape} (batch_size, input_features)")
print(f"W1 shape:       {nn.W1.shape} (input_features, hidden_neurons)")
print(f"A1 shape:       {nn.A1.shape} (batch_size, hidden_neurons)")
print(f"W2 shape:       {nn.W2.shape} (hidden_neurons, output_neurons)")
print(f"Output A2 shape:{out.shape} (batch_size, output_neurons)\\n")
print(f"Predictions:\\n{out}")`
      }
    },
    {
      title: 'The Math of Backpropagation (The Chain Rule)',
      content: `<p>Backpropagation is how the network learns. It asks: <em>"How much did each specific weight contribute to the final error?"</em></p>
<p>We compute the partial derivatives (gradients) of the Loss with respect to every weight in the network by traversing backward from the output layer to the input layer using the <strong>Chain Rule of Calculus</strong>.</p>
<h4>Output Layer Gradients</h4>
<p>The derivative of MSE loss with respect to final activation $A_2$ is $(A_2 - y_{true})$. The derivative of the activation function is $A_2(1-A_2)$.</p>
<p>$dZ_2 = (A_2 - y_{true}) \times \text{sigmoid\_derivative}(A_2)$</p>
<p>$dW_2 = A_1^T \cdot dZ_2$</p>
<h4>Hidden Layer Gradients</h4>
<p>We push the error $dZ_2$ backward through the weights $W_2$ to find the error at the hidden layer.</p>
<p>$dZ_1 = (dZ_2 \cdot W_2^T) \times \text{sigmoid\_derivative}(A_1)$</p>
<p>$dW_1 = X^T \cdot dZ_1$</p>`,
      code: {
        language: 'python',
        content: `    # (We are dynamically adding this method to the class defined above)
    def backward(self, X, y_true):
        """Perform backward pass to calculate gradients and update weights."""
        m = X.shape[0]  # batch size (used to average the gradients)
        
        # ── 1. Output Layer (Layer 2) Gradients ──
        # dZ2 represents the error signal at the final output node
        dZ2 = (self.A2 - y_true) * sigmoid_derivative(self.A2)
        
        # Calculate gradients for W2 and b2 using dot products
        # We divide by m to get the average gradient across the batch
        dW2 = (1 / m) * np.dot(self.A1.T, dZ2)
        db2 = (1 / m) * np.sum(dZ2, axis=0, keepdims=True)
        
        # ── 2. Hidden Layer (Layer 1) Gradients ──
        # Backpropagate the error signal through W2 to the hidden nodes
        dA1 = np.dot(dZ2, self.W2.T)
        dZ1 = dA1 * sigmoid_derivative(self.A1)
        
        # Calculate gradients for W1 and b1
        dW1 = (1 / m) * np.dot(X.T, dZ1)
        db1 = (1 / m) * np.sum(dZ1, axis=0, keepdims=True)
        
        # ── 3. Gradient Descent Weight Update ──
        # Move weights in the opposite direction of the gradient
        self.W2 -= self.lr * dW2
        self.b2 -= self.lr * db2
        self.W1 -= self.lr * dW1
        self.b1 -= self.lr * db1
        
    def train(self, X, y, epochs=10000, print_every=1000):
        """Standard training loop."""
        history = []
        for epoch in range(epochs):
            # Forward pass: compute predictions
            y_pred = self.forward(X)
            
            # Compute loss
            loss = self.compute_loss(y, y_pred)
            history.append(loss)
            
            # Backward pass: compute gradients and update weights
            self.backward(X, y)
            
            if (epoch % print_every == 0) or (epoch == epochs - 1):
                print(f"Epoch {epoch:5d} | Loss: {loss:.6f}")
                
        return history

# Attach the new methods to the DeepNeuralNetwork class
DeepNeuralNetwork.backward = backward
DeepNeuralNetwork.train = train
print("Backpropagation algorithms securely attached to the network class.")`
      },
      warning: 'Notice how matrix transposition (`.T`) is heavily used in backpropagation. `np.dot(self.A1.T, dZ2)` perfectly aligns the dimensions to sum the gradients across the batch. Dimension mismatch errors here are the most common bug when writing neural networks from scratch.'
    },
    {
      title: 'Conquering the XOR Problem',
      content: `<p>We now have a fully functional Deep Neural Network. Let's see if the hidden layer allows it to learn a non-linear representation and solve the XOR problem that defeated the simple perceptron.</p>`,
      code: {
        language: 'python',
        content: `# XOR dataset
X_xor = np.array([
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1]
])
# Reshape y to be a 2D column vector [4, 1] matching network output shape
y_xor = np.array([[0], [1], [1], [0]])

# Initialize network: 2 inputs, 4 hidden neurons, 1 output neuron
# Learning rate 0.5 is relatively high, but works well for this simple noise-free problem
nn_xor = DeepNeuralNetwork(input_size=2, hidden_size=4, output_size=1, learning_rate=0.5)

print("─── Training Deep MLP on XOR ───")
loss_history = nn_xor.train(X_xor, y_xor, epochs=5000, print_every=1000)

print("\\n─── Final Predictions ───")
# Perform a final forward pass
preds = nn_xor.forward(X_xor)
for i in range(4):
    raw_prob = preds[i][0]
    binary_class = 1 if raw_prob > 0.5 else 0
    print(f"Input: {X_xor[i]} | Target: {y_xor[i][0]} | Pred Prob: {raw_prob:.4f} -> Class {binary_class}")

print("\\nSuccess! The network has perfectly learned the XOR function.")`
      },
      note: 'How does it work? The hidden layer maps the 2D non-linearly separable XOR inputs into a 4-dimensional feature space. In this new high-dimensional space, the points get "twisted" so that they ARE linearly separable by the final output neuron. Feature representation learning is the absolute core of Deep Learning.'
    },
    {
      title: 'The Problem with Sigmoid: Vanishing Gradients',
      content: `<p>While our network solved XOR, it used the Sigmoid activation function in the hidden layer. If we were to build a network with 10 hidden layers, Sigmoid would cause training to completely stall.</p>
<p><strong>Why?</strong> The maximum value of the Sigmoid derivative <code>a * (1-a)</code> is 0.25 (at $z=0$). In backpropagation, we multiply gradients together using the chain rule. Multiplying 0.25 by 0.25 by 0.25 across 10 layers causes the gradient to become infinitesimally small. The layers closest to the input receive gradients near 0 and stop learning entirely. This is the <strong>Vanishing Gradient Problem</strong>.</p>
<p>This is why modern deep networks use <strong>ReLU (Rectified Linear Unit)</strong> for hidden layers, whose derivative is a solid $1.0$ for positive inputs, allowing gradients to flow backwards unimpeded.</p>`,
    }
  ],
  exercises: [
    'Modify the network to use the ReLU activation function in the hidden layer instead of Sigmoid (You must update both the forward pass and the `dZ1` calculation in the backward pass). Train it again. Does it converge to a low loss faster (in fewer epochs)?',
    'What happens if you initialize all weights in `W1` and `W2` to exactly zero instead of random numbers? Modify the `__init__` method, run training, and observe the predictions. (Hint: Research the "Symmetry Breaking" problem in neural networks).',
    'Increase the hidden size to 20, then decrease it to 2. Observe the training loss curve. What is the absolute minimum number of hidden neurons required to mathematically solve XOR?',
    'Write a script to plot the `loss_history` array using matplotlib to visualize the gradient descent curve.',
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
