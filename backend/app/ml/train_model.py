import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_score, recall_score, f1_score
from backend.app.ml.features import extract_url_features, FEATURE_NAMES, features_dict_to_vector

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(MODEL_DIR, "phishing_model.joblib")
META_PATH = os.path.join(MODEL_DIR, "model_metadata.joblib")


def get_curated_training_data():
    """
    Returns curated training samples covering phishing and benign patterns
    used when an external LegitPhish raw CSV is absent.
    """
    phishing_samples = [
        "http://secure-sbi-login.verify-portal.invalid/update-kyc",
        "http://192.168.1.100/bank-signin/index.php",
        "http://bit.ly/sbi-urgent-reward-2026",
        "http://hdfc-bank-netbanking-alert.security-auth.invalid/login",
        "http://icici-verify-account.info.invalid/session/update",
        "http://free-iphone-winner-kbc.claim-reward.invalid/register",
        "http://t.co/claim-crypto-bonus-now",
        "http://telegram-work-daily-payout.invalid/task?ref=98765",
        "http://axis-bank-pan-card-link.support-kyc.invalid/verify",
        "http://paytm-kyc-expired-urgent.service-center.invalid/kyc",
        "http://secure-paypal-confirm-account.fraud-alert.invalid/webapps",
        "http://netflix-billing-suspended.account-update.invalid/payment",
        "http://amazon-order-refund-resolution.invalid/help?order=3948",
        "http://185.220.101.5/banking/login.html",
        "http://xn--sbi-9cd.invalid/banking-portal",
        "http://tinyurl.com/free-usdt-airdrop-bonus",
        "http://electricity-bill-power-cutoff.payment-gateway.invalid/bill",
        "http://fedex-parcel-customs-hold.courier-clearance.invalid/pay",
        "http://appleid-device-locked.icloud-security.invalid/auth",
        "http://microsoft-365-password-expired.office-portal.invalid/reset",
        "http://income-tax-refund-claim-approval.dept.invalid/itr-v",
        "http://upi-rewards-cashback-gpay.offers-promotions.invalid/vpa",
        "http://whatapp-gold-exclusive-download.apk-installer.invalid/get",
        "http://cryptocurrency-doubler-investment.yield-farm.invalid/deposit",
        "http://sbi-reward-points-redemption.portal-services.invalid/redeem",
        "http://cutt.ly/instant-loan-approval-no-documents",
        "http://103.20.12.54/fake-login/sbi.html",
        "http://axis-support-desk-help.invalid/unblock-card",
        "http://kotak-811-kyc-reactivation.security-alert.invalid/form",
        "http://punjab-national-bank-fraud-dept.support-update.invalid/case",
        "http://is.gd/airtel-sim-kyc-update",
        "http://jio-free-5g-data-recharge.promotions-offer.invalid/claim",
        "http://post-office-parcel-undelivered.postal-tracking.invalid/fee",
        "http://google-drive-shared-invoice.file-download.invalid/doc?id=238",
        "http://binance-unauthorized-withdrawal-alert.sec-check.invalid/auth"
    ]

    benign_samples = [
        "https://www.google.com/search?q=cybersecurity+best+practices",
        "https://en.wikipedia.org/wiki/Phishing",
        "https://github.com/torvalds/linux",
        "https://www.python.org/downloads/",
        "https://stackoverflow.com/questions/11227809/why-is-processing-a-sorted-array-faster",
        "https://fastapi.tiangolo.com/tutorial/first-steps/",
        "https://www.rbi.org.in/Scripts/AboutUsDisplay.aspx",
        "https://cybercrime.gov.in/Webform/Crime_AuthoLogin.aspx",
        "https://www.onlinesbi.sbi/",
        "https://www.hdfcbank.com/personal/ways-to-bank/online-banking",
        "https://www.icicibank.com/personal-banking",
        "https://www.bankofbaroda.in/",
        "https://scikit-learn.org/stable/modules/ensemble.html",
        "https://pandas.pydata.org/docs/getting_started/index.html",
        "https://networkx.org/documentation/stable/tutorial.html",
        "https://docs.python.org/3/library/hashlib.html",
        "https://developer.mozilla.org/en-US/docs/Web/HTTP",
        "https://aws.amazon.com/security/",
        "https://www.microsoft.com/en-in/",
        "https://www.apple.com/in/",
        "https://arxiv.org/abs/2301.00001",
        "https://news.ycombinator.com/",
        "https://www.kaggle.com/datasets",
        "https://www.eff.org/pages/tor-and-https",
        "https://www.cert-in.org.in/",
        "https://www.npci.org.in/what-we-do/upi/product-overview",
        "https://www.cisa.gov/resources-tools/resources/phishing-infographic",
        "https://pypi.org/project/fastapi/",
        "https://docs.sqlalchemy.org/en/20/orm/quickstart.html",
        "https://www.who.int/",
        "https://www.bbc.com/news",
        "https://timesofindia.indiatimes.com/",
        "https://www.thehindu.com/sci-tech/technology/",
        "https://www.reuters.com/technology/",
        "https://www.bloomberg.com/"
    ]

    urls = phishing_samples + benign_samples
    labels = [1] * len(phishing_samples) + [0] * len(benign_samples)
    return pd.DataFrame({"url": urls, "label": labels})


def train_phishing_model(raw_dataset_path: str = None) -> dict:
    """
    Trains a Scikit-Learn RandomForest classifier for phishing URL detection.
    Computes accuracy, precision, recall, F1, and confusion matrix.
    Saves model and metadata using joblib.
    """
    df = None
    if raw_dataset_path and os.path.exists(raw_dataset_path):
        try:
            print(f"Reading external dataset from {raw_dataset_path}...")
            raw_df = pd.read_csv(raw_dataset_path)
            # Detect url and label column names dynamically
            url_col = None
            label_col = None
            for col in raw_df.columns:
                lower = col.lower().strip()
                if "url" in lower:
                    url_col = col
                if lower in ["label", "class", "target", "status", "result"]:
                    label_col = col

            if url_col and label_col:
                clean_df = raw_df[[url_col, label_col]].dropna()
                # Normalize binary labels (e.g., 'phishing'/1 vs 'benign'/0)
                clean_df["label"] = clean_df[label_col].apply(
                    lambda x: 1 if str(x).lower().strip() in ["1", "phishing", "bad", "malicious", "yes"] else 0
                )
                df = pd.DataFrame({"url": clean_df[url_col].astype(str), "label": clean_df["label"]})
                print(f"Loaded {len(df)} samples from {raw_dataset_path}")
        except Exception as e:
            print(f"Warning: Failed to load external dataset: {e}. Falling back to curated data.")

    if df is None or len(df) < 10:
        print("Using curated training dataset for baseline phishing model...")
        df = get_curated_training_data()

    # Extract features for all URLs
    feature_rows = []
    for u in df["url"]:
        feats = extract_url_features(u)
        feature_rows.append(features_dict_to_vector(feats))

    X = np.array(feature_rows)
    y = df["label"].values

    # Train/Test Split (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    # Classification Model
    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=8,
        random_state=42,
        class_weight="balanced"
    )
    clf.fit(X_train, y_train)

    # Evaluation
    y_pred = clf.predict(X_test)
    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    cm = confusion_matrix(y_test, y_pred).tolist()

    metrics = {
        "accuracy": acc,
        "precision": prec,
        "recall": rec,
        "f1_score": f1,
        "confusion_matrix": cm,
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "feature_names": FEATURE_NAMES
    }

    # Save model and metadata using Joblib
    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(clf, MODEL_PATH)
    joblib.dump(metrics, META_PATH)

    print(f"Model successfully trained and saved to {MODEL_PATH}")
    print(f"Evaluation Metrics: Accuracy={acc:.3f}, Precision={prec:.3f}, Recall={rec:.3f}, F1={f1:.3f}")
    return metrics


if __name__ == "__main__":
    train_phishing_model()
