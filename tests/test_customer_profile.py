from profiles.customer_profile import CustomerProfile, DEFAULT_PROFILE_ID


def test_load_profile_defaults_to_existing_profile():
    profile = CustomerProfile.load("acme")
    assert profile.id == "acme"
    assert profile.default_currency == "EUR"


def test_missing_profile_falls_back_to_default(caplog):
    caplog.set_level("WARNING")
    profile = CustomerProfile.load("missing")
    assert profile.id == DEFAULT_PROFILE_ID
    assert "Profile 'missing' not found" in caplog.text


def test_form_specific_examples_extend_defaults():
    profile = CustomerProfile.load("default")
    text = profile.to_prompt_metadata("default_form")
    assert "Active form" in text
    examples = profile.few_shot_examples("default_form")
    assert "Acme Corp" in examples
