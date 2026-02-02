"""
Upload pre-trained model to Hugging Face Hub
"""

import os
import sys
from huggingface_hub import HfApi, create_repo, upload_folder
from pathlib import Path

def upload_model():
    """Upload the pre-trained model to Hugging Face Hub"""
    
    model_path = "./models/verifily-pretrained-20260202_104609"
    repo_name = "verifily-ai-detector"  # You can change this
    
    print("=" * 60)
    print("Uploading Verifily Pre-trained Model to Hugging Face Hub")
    print("=" * 60)
    print()
    
    # Check if model exists
    if not os.path.exists(model_path):
        print(f"❌ Model not found at: {model_path}")
        sys.exit(1)
    
    print(f"📦 Model path: {model_path}")
    print(f"🏷️  Repository name: {repo_name}")
    print()
    
    # Get HuggingFace token
    token = os.environ.get("HF_TOKEN")
    
    if not token:
        print("🔑 Please enter your Hugging Face token:")
        print("   (Get it from: https://huggingface.co/settings/tokens)")
        print()
        token = input("Token: ").strip()
        
        if not token:
            print("❌ Token is required!")
            sys.exit(1)
    
    try:
        # Initialize API
        api = HfApi(token=token)
        
        # Get username
        user_info = api.whoami(token=token)
        username = user_info['name']
        full_repo_id = f"{username}/{repo_name}"
        
        print(f"👤 Uploading as: {username}")
        print(f"🎯 Repository: {full_repo_id}")
        print()
        
        # Create repository (if it doesn't exist)
        print("📝 Creating repository...")
        try:
            create_repo(
                repo_id=repo_name,
                token=token,
                exist_ok=True,
                private=False  # Set to True if you want a private model
            )
            print("✅ Repository created/verified")
        except Exception as e:
            print(f"⚠️  Repository creation: {e}")
        
        # Upload model files
        print()
        print("⬆️  Uploading model files (this may take 5-10 minutes)...")
        print()
        
        upload_folder(
            folder_path=model_path,
            repo_id=full_repo_id,
            token=token,
            repo_type="model",
            commit_message="Upload pre-trained Verifily AI detector (RAID dataset, 100% accuracy)"
        )
        
        print()
        print("=" * 60)
        print("✅ MODEL UPLOADED SUCCESSFULLY!")
        print("=" * 60)
        print()
        print(f"🔗 Model URL: https://huggingface.co/{full_repo_id}")
        print()
        print("📝 Next steps:")
        print(f"   1. Update VERIFILY_CUSTOM_MODEL to: {full_repo_id}")
        print(f"   2. Set in Railway: railway variables --service verifily-backend --set \"VERIFILY_CUSTOM_MODEL={full_repo_id}\"")
        print(f"   3. Deploy: railway up --service verifily-backend")
        print()
        
        return full_repo_id
        
    except Exception as e:
        print()
        print(f"❌ Upload failed: {e}")
        print()
        print("Troubleshooting:")
        print("  1. Check your token has write permissions")
        print("  2. Visit: https://huggingface.co/settings/tokens")
        print("  3. Create a new token with 'write' access")
        sys.exit(1)

if __name__ == "__main__":
    upload_model()
