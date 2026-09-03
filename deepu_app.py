# =====================================================================
# APPLICATION NAME : Deepu App (legacy Streamlit sketch)
# The complete product is the website in index.html + Google Sheets
# via gas/Code.gs. Open index.html or follow README.md to host it free.
# =====================================================================

import streamlit as st
import sqlite3
import os
import pandas as pd
from datetime import datetime, timedelta

# Force full width page configuration layout
st.set_page_config(page_title="📱 Deepu App v2.5.6", layout="wide")

# Secure Storage Location
base_dir = os.environ.get("LOCALAPPDATA", os.path.expanduser("~"))
db_path = os.path.join(base_dir, "deepu_app_system.db")

def init_db():
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("CREATE TABLE IF NOT EXISTS accounts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL, closing_day INTEGER DEFAULT 31, total_limit REAL DEFAULT 0.0, last_upgrade_amt REAL DEFAULT 0.0, last_upgrade_date TEXT DEFAULT '', anniversary_date TEXT DEFAULT '', fee_waiver_target REAL DEFAULT 0.0, is_family_person INTEGER DEFAULT 0)")
        cursor.execute("CREATE TABLE IF NOT EXISTS future_ledger (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT, card_or_person TEXT, target_statement_month TEXT, description TEXT, debit REAL, credit REAL, is_emi INTEGER DEFAULT 0, emi_current_month INTEGER DEFAULT 0, emi_total_months INTEGER DEFAULT 0, emi_interest_rate REAL DEFAULT 0.0, emi_remaining_principal REAL DEFAULT 0.0, linked_member TEXT, emi_flat_member_amt REAL DEFAULT 0.0, emi_base_amt REAL DEFAULT 0.0, emi_principal_paid REAL DEFAULT 0.0, emi_interest_paid REAL DEFAULT 0.0, emi_gst_paid REAL DEFAULT 0.0, outstanding_emi_balance REAL DEFAULT 0.0)")
        
        # Enforce clean schema migrations on cold start
        try:
            cursor.execute("ALTER TABLE accounts ADD COLUMN is_family_person INTEGER DEFAULT 0")
        except sqlite3.OperationalError: pass

        # Force re-injection recovery protocol to guarantee backend records exist
        cursor.execute("SELECT COUNT(*) FROM accounts")
        if cursor.fetchone() <= 2:
            cursor.execute("DELETE FROM accounts")
            defaults = [
                ("Card ICICI", 22, 328000.0, 74000.0, "20-Dec-2023", "22-Sep-2025", 150000.0, 0), 
                ("Card Amex", 25, 250000.0, 0.0, "", "10-Jan-2026", 200000.0, 0), 
                ("Deepu SBI Card", 22, 254000.0, 0.0, "", "03-Sep-2026", 300000.0, 0),
                ("Deepu", 31, 0.0, 0.0, "", "", 0.0, 1), 
                ("Family Member Anu", 31, 0.0, 0.0, "", "", 0.0, 1)
            ]
            for name, day, t_lim, up_amt, up_dt, ann_dt, wa_tgt, is_fam in defaults:
                cursor.execute("INSERT OR IGNORE INTO accounts (name, closing_day, total_limit, last_upgrade_amt, last_upgrade_date, anniversary_date, fee_waiver_target, is_family_person) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", (name, day, t_lim, up_amt, up_dt, ann_dt, wa_tgt, is_fam))
        conn.commit()

init_db()

def clean_display_name(text_str):
    if not text_str: return ""
    return str(text_str).replace("_", " ")

def parse_custom_date(date_str):
    for fmt in ("%d-%b-%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(date_str.strip(), fmt)
        except ValueError: continue
    return None

def calculate_statement_month(tx_date_str, account_name):
    tx_date = parse_custom_date(tx_date_str)
    if not tx_date: return "Unsorted"
    closing_day = 31
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT closing_day FROM accounts WHERE name = ?", (account_name,))
        row = cursor.fetchone()
        if row: closing_day = int(row)
    if tx_date.day > closing_day:
        if tx_date.month == 12: target_date = datetime(tx_date.year + 1, 1, 1)
        else: target_date = datetime(tx_date.year, tx_date.month + 1, 1)
    else: target_date = tx_date
    return target_date.strftime("%b%y")

st.title("📱 Deepu App — Universal Master Workspace")
st.markdown("### `Version 2.5.6` | Unlocked Action Engine Active")

tab1, tab2 = st.tabs(["📝 Log Transaction & Scale Profiles", "🔍 Retrieve Data History & Amortization Charts"])

# ==================== WEB TAB 1: DATA LOGGING INTERFACE ====================
with tab1:
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM accounts WHERE is_family_person = 0 ORDER BY name ASC")
        bank_cards_only = [clean_display_name(r[0]) for r in cursor.fetchall()]
        
        cursor.execute("SELECT name FROM accounts WHERE is_family_person = 1 ORDER BY name ASC")
        family_friends_only = [clean_display_name(r[0]) for r in cursor.fetchall()]
        
        cursor.execute("SELECT name FROM accounts ORDER BY name ASC")
        all_accounts = [clean_display_name(r[0]) for r in cursor.fetchall()]

    if not bank_cards_only: bank_cards_only = ["Deepu SBI Card", "Card ICICI", "Card Amex"]
    if not family_friends_only: family_friends_only = ["Deepu", "Family Member Anu"]

    st.header("➕ Register or Update Profiles")
    col1, col2, col3 = st.columns(3)
    with col1:
        new_acc_name = st.text_input("Profile Name (e.g. Deepu HDFC Card)", key="new_acc")
        closing_cycle_day = st.number_input("Statement Cut-off Day (1-31)", min_value=1, max_value=31, value=22, key="cc_day")
        is_it_family = st.checkbox("Check this box if this profile is a Person/Friend", key="is_fam")
    with col2:
        card_total_limit = st.number_input("Total Credit Limit (₹)", min_value=0, value=0, key="t_lim")
        last_upgrade_val = st.number_input("Last Upgrade Amount (₹)", min_value=0, value=0, key="l_up")
    with col3:
        last_upgrade_dt = st.text_input("Upgrade Date (DD-Mon-YYYY)", value="20-Dec-2023", key="up_dt")
        card_ann_dt = st.text_input("Anniversary Issue Date (DD-Mon-YYYY)", value="22-Sep-2025", key="ann_dt")
        fee_waiver_tgt = st.number_input("Annual Fee Waiver Spend Target (₹)", min_value=0, value=150000, key="w_tgt")
        
    if st.button("💾 Register / Update Master Profile", key="btn_reg"):
        if new_acc_name.strip():
            clean_name = clean_display_name(new_acc_name.strip())
            fam_flag = 1 if is_it_family else 0
            with sqlite3.connect(db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("INSERT INTO accounts (name, closing_day, total_limit, last_upgrade_amt, last_upgrade_date, anniversary_date, fee_waiver_target, is_family_person) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(name) DO UPDATE SET closing_day=excluded.closing_day, total_limit=excluded.total_limit, last_upgrade_amt=excluded.last_upgrade_amt, last_upgrade_date=excluded.last_upgrade_date, anniversary_date=excluded.anniversary_date, fee_waiver_target=excluded.fee_waiver_target, is_family_person=excluded.is_family_person", (clean_name, closing_cycle_day, card_total_limit, last_upgrade_val, last_upgrade_dt, card_ann_dt, fee_waiver_tgt, fam_flag))
                conn.commit()
            st.success(f"Successfully configured and locked profile parameters for '{clean_name}'!")
            st.rerun()

    st.header("❌ Remove Old Profiles")
    profile_to_remove = st.selectbox("Select Profile / Member to Delete", ["-- Choose Profile --"] + all_accounts, key="del_sel")
    if st.button("🗑️ Delete Selected Profile", key="btn_del"):
        if profile_to_remove != "-- Choose Profile --":
            with sqlite3.connect(db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM accounts WHERE name = ?", (profile_to_remove,))
                conn.commit()
            st.error(f"Removed '{profile_to_remove}' completely from registries!")
            st.rerun()

    st.markdown("---")
    st.header("📝 Log New Transaction Entry")
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT description FROM future_ledger ORDER BY description ASC")
        historical_merchants = [clean_display_name(r[0]) for r in cursor.fetchall()]

    tx_date_str = st.text_input("Transaction Date (DD-Mon-YYYY)", value=datetime.now().strftime("%d-%b-%Y"), key="tx_dt")
    
    col_list1, col_list2 = st.columns(2)
    with col_list1:
        target_account = st.selectbox("Select Bank Credit Card", bank_cards_only, key="tgt_acc")
    with col_list2:
        linked_family_member = st.selectbox("Select Family/Friend", ["None"] + family_friends_only, key="lnk_mem")
        
    search_past_merchant = st.selectbox("⚡ Autocomplete from History (Optional)", ["-- Start Typing / Select Merchant --"] + historical_merchants, key="srch_merch")
    manual_tx_description = st.text_input("Or Type Description Details Manually", key="man_desc")
    tx_description = clean_display_name(manual_tx_description if search_past_merchant == "-- Start Typing / Select Merchant --" else search_past_merchant)
    
    col_amt1, col_amt2 = st.columns(2)
    with col_amt1:
        debit_value = st.number_input("Debit / Due to Bank (₹)", min_value=0, value=0, key="deb_val")
    with col_amt2:
        credit_value = st.number_input("Credit / My Money with Bank (₹)", min_value=0, value=0, key="cred_val")
        
    st.markdown("#### Amortization Processing Options")
    convert_to_emi = st.checkbox("Convert this purchase to a Master Amortization Schedule Chart", key="conv_emi")
    
    col_emi1, col_emi2, col_emi3 = st.columns(3)
    with col_emi1:
        emi_total_tenor = st.number_input("Total Loan Tenor (Months)", min_value=1, value=12, key="tenor")
    with col_emi2:
        emi_active_m = st.number_input("Current Active Month (Migration Counter)", min_value=1, value=1, key="act_m")
    with col_emi3:
