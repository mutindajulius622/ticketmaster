# Fix Inquiry Resources - TODO List

## Issue
The `server/urls/__init__.py` imports inquiry resource classes that don't exist in `server/main.py`:
- `Inquiries`
- `InquiryById`
- `PropertyInquiries`
- `MyInquiries`

## Plan
1. [ ] Add Inquiry model import to server/main.py
2. [ ] Add Inquiry resource classes to server/main.py
3. [ ] Update imports in server/urls/__init__.py
4. [ ] Test the server starts without errors

## Files to Modify
1. `server/main.py` - Add Inquiry model import and resource classes
2. `server/urls/__init__.py` - Fix imports to match available resources

