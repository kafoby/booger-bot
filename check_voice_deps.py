import sys
import ctypes.util

print("Checking Voice Dependencies...")

try:
    import discord
    print(f"[OK] discord.py version: {discord.__version__}")
except ImportError:
    print("[FAIL] discord.py is not installed")

try:
    import nacl
    print(f"[OK] PyNaCl version: {nacl.__version__}")
except ImportError:
    print("[FAIL] PyNaCl is not installed. Voice requires 'pip install PyNaCl'")

try:
    import discord.opus
    if discord.opus.is_loaded():
        print("[OK] libopus is already loaded")
    else:
        print("[INFO] libopus not loaded by default, attempting to find...")
        lib = ctypes.util.find_library('opus')
        if lib:
            print(f"[OK] Found libopus at: {lib}")
            try:
                discord.opus.load_opus(lib)
                print("[OK] Successfully loaded libopus")
            except Exception as e:
                print(f"[FAIL] Could not load libopus: {e}")
        else:
            print("[FAIL] Could not find libopus via ctypes.util.find_library('opus')")
            # Try manual load of common name
            try:
                discord.opus.load_opus('libopus.so.0')
                print("[OK] Loaded libopus.so.0 manually")
            except:
                print("[FAIL] Failed to load libopus.so.0 manually")

except ImportError:
    print("[FAIL] discord.opus module error")

print("Check complete.")
