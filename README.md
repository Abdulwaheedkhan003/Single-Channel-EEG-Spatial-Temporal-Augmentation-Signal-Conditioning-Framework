Here is the complete, high-converting GitHub `README.md` file extracted and translated directly from your HTML source code. You can copy and paste this directly into your repository.

```markdown
# 🧠 EEG Motor Imagery BCI — Wheelchair Classification
> **Translating Motor Imagery Signals into Real-Time Assistive Wheelchair Navigation**

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-Machine_Learning-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)
![SciPy](https://img.shields.io/badge/SciPy-Signal_Processing-8CA1AF?style=for-the-badge&logo=scipy&logoColor=white)
![Accuracy](https://img.shields.io/badge/Peak_Accuracy-83.1%25-00F5A0?style=for-the-badge)

---

## 📌 Overview

**EEG Motor Imagery Classification for Wheelchair Control** is a complete Brain-Computer Interface (BCI) pipeline that decodes imagined motor movements (left vs. right hand/arm imagery) into real-time directional commands. By measuring Event-Related Desynchronisation (ERD) in the beta band ($12\text{--}30\text{ Hz}$), this system processes continuous single/multi-band EEG signals to execute hands-free wheelchair steering commands at 8 Hz inference speed.

---

## 📊 Key Performance Metrics

| Metric | Specification / Result |
| :--- | :--- |
| **Peak Test Accuracy** | **83.1%** (60/40 Split) |
| **Sampling Rate ($f_s$)** | $256\text{ Hz}$ |
| **Frequency Bands** | 5 ($\Delta, \Theta, \alpha, \beta, \gamma$) |
| **Feature Matrix Shape** | $11 \times 11$ ($121\text{-dimensional}$ vector per trial) |
| **Cross-Validation** | 10-Fold Stratified K-Fold |
| **Inference Frequency** | $8\text{ Hz}$ ($0.125\text{s}$ tick rate) |

---

## 🔬 9-Step Architecture & Pipeline


```

┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
│ 1. Raw Data Ingestion  │ ───► │ 2. Butterworth Filter  │ ───► │ 3. Sliding Windowing   │
│   (256 Hz Continuous)  │      │  (4th-Order Bandpass)  │      │ (256-sample, 8-step)   │
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘
│
▼
┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
│ 6. Matrix Spanning     │ ◄─── │ 5. Feature Extraction  │ ◄─── │ 4. Noise Augmentation  │
│ (11x11 Grid & β-Scale) │      │  (Log-Variance Power)  │      │  (Gaussian Injection)  │
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘
│
▼
┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
│ 7. Preprocessing Stack │ ───► │ 8. GridSearchCV LDA    │ ───► │ 9. Telemetry Export    │
│ (Scaler+KBest+PCA(25)) │      │  (SVD / Shrinkage)     │      │ (JSON Weights Deployment)│
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘

```

1. **Raw Signal Acquisition**: Loads continuous EEG from source files at $256\text{ Hz}$.
2. **Butterworth Bandpass Filtering**: 4th-order filters extract Delta ($\Delta$), Theta ($\Theta$), Alpha ($\alpha$), Beta ($\beta$), and Gamma ($\gamma$) bands with zero-phase distortion using `filtfilt`.
3. **High-Density Sliding Window**: 1-second windows ($256\text{ samples}$) with an 8-sample stride generate a dense trial pool.
4. **Noise-Based Augmentation**: Injects $\sigma$-proportional Gaussian noise ($1\%\text{ std}$) to double trial density while preserving underlying structural power.
5. **Log-Variance Feature Extraction**: Computes $\log(\text{Var} + \epsilon)$ for each frequency band to linearize exponential power relationships.
6. **$11 \times 11$ Matrix Spanning**: Tiles 5 log-variance features across a 121-element array, scaling Beta power $\times 1.5$ along the primary diagonal.
7. **Dimensionality Reduction**: Standardizes features, selects top 50 via ANOVA F-test (`SelectKBest`), and applies PCA down to 25 principal components.
8. **GridSearchCV LDA Classification**: Trains a Linear Discriminant Analysis engine optimizing over solvers (`lsqr`, `eigen`) and shrinkage hyperparameters.
9. **Weights Export & Telemetry**: Serializes weights ($w, w_0$) to JSON and executes live inference streaming at $8\text{ Hz}$.

---

## 📐 Mathematical Formulation (Manual LDA Engine)

The classification framework leverages Fisher’s Linear Discriminant Analysis, derived step-by-step from raw matrices:

1. **Class Mean Vectors:**
   $$\mu_k = \frac{1}{N_k} \sum_{x \in C_k} x$$

2. **Regularized Within-Class Scatter Matrix:**
   $$S_W = \sum_k \sum_{x \in C_k} (x - \mu_k)(x - \mu_k)^T + \alpha I$$

3. **Between-Class Scatter Matrix:**
   $$S_B = \sum_k N_k (\mu_k - \mu_{\text{total}})(\mu_k - \mu_{\text{total}})^T$$

4. **Fisher Weight Vector & Bias:**
   $$w = S_W^{-1} (\mu_0 - \mu_1), \quad w_0 = -\frac{1}{2} w^T (\mu_0 + \mu_1)$$

5. **Decision Boundary Prediction:**
   $$f(x) = w^T x + w_0 \implies \hat{y} = \begin{cases} 0 \text{ (Turn Left)}, & \text{if } f(x) > 0 \\ 1 \text{ (Turn Right)}, & \text{otherwise} \end{cases}$$

---

## 📈 Classification Performance

### Split Evaluation Results
* **60 / 40 Split:** **83.1%** Peak Test Accuracy
* **70 / 30 Split:** **81.9%** Test Accuracy
* **80 / 20 Split:** **80.2%** Test Accuracy
* **10-Fold Cross-Validation:** Verified across stratified folds.

### Confusion Matrix (60/40 Split)
| | Predicted Left | Predicted Right |
| :--- | :---: | :---: |
| **Actual Left** | **71** (TP) | **15** (FP) |
| **Actual Right** | **5** (FN) | **73** (TN) |

---

## ⚙️ Installation & Usage

### 1. Requirements
Install the scientific Python dependencies:
```bash
pip install numpy pandas scipy scikit-learn matplotlib seaborn

```

### 2. Code Execution

```python
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.decomposition import PCA
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
from sklearn.model_selection import GridSearchCV, StratifiedKFold, cross_val_score

# 1. Pipeline Assembly
scaler = StandardScaler()
selector = SelectKBest(score_func=f_classif, k=50)
pca = PCA(n_components=25)
lda = LinearDiscriminantAnalysis()

param_grid = {"solver": ["lsqr", "eigen"], "shrinkage": ["auto", None]}
grid_search = GridSearchCV(lda, param_grid, cv=5, scoring="accuracy", n_jobs=-1)

# 2. Fit Pipeline & Evaluate
X_train_proc = pca.fit_transform(selector.fit_transform(scaler.fit_transform(X_train), y_train))
X_test_proc = pca.transform(selector.transform(scaler.transform(X_test)))
grid_search.fit(X_train_proc, y_train)

cv_scores = cross_val_score(grid_search.best_estimator_, X_train_proc, y_train, 
                            cv=StratifiedKFold(n_splits=10), scoring="accuracy")
print(f"10-Fold CV Accuracy: {cv_scores.mean()*100:.2f}% ± {cv_scores.std()*100:.2f}%")

```

---

## 📡 Live Telemetry Simulation

During execution, inference runs every **0.125 seconds** ($8\text{ Hz}$), clamping continuous Beta power values to a physiological range of $5\text{--}45\,\mu\text{V}^2$:

```text
=======================================================================
     REAL-TIME TELEMETRY STREAM — 60/40 SPLIT (83.1%)
  Beta power: 5–45 uV²  |  Inference tick: 0.125 s  |  SR: 256 Hz
=======================================================================
[Time +0.000s]  Beta Power: 28.45 uV²  →  ⬅️  TURN LEFT
[Time +0.125s]  Beta Power: 29.12 uV²  →  ⬅️  TURN LEFT
[Time +0.250s]  Beta Power: 31.88 uV²  →  ⬅️  TURN LEFT
[Time +0.500s]  Beta Power: 27.67 uV²  →  ⬅️  TURN LEFT
[Time +0.625s]  Beta Power:  7.15 uV²  →  ➡️  TURN RIGHT
[Time +0.750s]  Beta Power:  8.93 uV²  →  ➡️  TURN RIGHT
[Time +1.000s]  Beta Power:  9.22 uV²  →  ➡️  TURN RIGHT
🏁 Live streaming simulation completed successfully.

```

---

## 🛠️ Technology Stack

* **Language:** Python 3.x
* **Signal Processing:** SciPy (`scipy.signal.butter`, `filtfilt`)
* **Machine Learning:** scikit-learn (`StandardScaler`, `SelectKBest`, `PCA`, `LinearDiscriminantAnalysis`, `GridSearchCV`)
* **Scientific Computing:** NumPy, Pandas
* **Visualization:** Matplotlib, Seaborn
* **Deployment Format:** JSON Weight Matrices

```

```
