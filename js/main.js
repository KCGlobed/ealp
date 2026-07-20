var BASE_URL = "https://kcglobed-gcc-website-932479078084.asia-south1.run.app";
var GCC_BACKEND_URL = "https://gccwebsite-admin-backend-738131651355.asia-south1.run.app";
var mode = "sandbox";

if (window.location.hostname.includes("gccschool.com")) {
    BASE_URL = "https://gcc-website-prod-932479078084.europe-west1.run.app";
    GCC_BACKEND_URL = "https://gccwebsite-admin-prod-backend-738131651355.asia-south1.run.app";
    mode = "production";
} else if (window.location.hostname.includes("localhost")) {
    BASE_URL = "https://kcglobed-gcc-website-932479078084.asia-south1.run.app";
    GCC_BACKEND_URL = "https://gccwebsite-admin-backend-738131651355.asia-south1.run.app";
    mode = "sandbox";
}

var API_BASE = GCC_BACKEND_URL;

document.addEventListener("DOMContentLoaded", function () {
    const navbar = document.querySelector('.first-navbar');
    window.addEventListener('scroll', function () {
        if (window.scrollY >= 100) {
            navbar.classList.add('sticky');
        } else {
            navbar.classList.remove('sticky');
        }
    });


    let stateCityData = {};
    fetch('assets/state_city.json')
        .then(res => res.json())
        .then(data => {
            stateCityData = data;
            // Populate state dropdowns
            const stateDropdowns = document.querySelectorAll('select[id="state"], select.state-select');
            const states = Object.keys(data).sort((a, b) => a.localeCompare(b));

            stateDropdowns.forEach(select => {
                states.forEach(state => {
                    const opt = document.createElement('option');
                    opt.value = state;
                    opt.textContent = state;
                    select.appendChild(opt);
                });

                // Add event listener to populate cities
                select.addEventListener('change', function () {
                    const selectedState = this.value;
                    const container = this.closest('form') || this.parentElement.parentElement;
                    const citySelect = container.querySelector('select[id="city"]') || container.querySelector('select.city-select');

                    if (citySelect) {
                        citySelect.innerHTML = '<option value="" disabled selected>Select City</option>';
                        const cities = (stateCityData[selectedState] || []).sort((a, b) => a.localeCompare(b));
                        cities.forEach(city => {
                            const opt = document.createElement('option');
                            opt.value = city;
                            opt.textContent = city;
                            citySelect.appendChild(opt);
                        });
                    }
                });
            });
        })
        .catch(err => console.error("Error loading state-city data:", err));

    // ----------------------------------------------------
    // 7. Universities Dynamic Select Dropdown
    // ----------------------------------------------------
    let universities = [];
    let highlightedUniversities = [];
    let allUniversities = [];

    // Fetch lists
    Promise.all([
        fetch('assets/universities.json').then(res => res.json()),
        fetch('assets/select-university.json').then(res => res.json())
    ]).then(([uniList, selectList]) => {
        // filter normal list to exclude highlights
        const normalList = uniList.filter(name => !selectList.includes(name));
        universities = normalList.map((name, index) => ({ id: `u-${index}`, name, isHighlight: false }));
        highlightedUniversities = selectList.map((name, index) => ({ id: `s-${index}`, name, isHighlight: true }));
        allUniversities = [...universities, ...highlightedUniversities];

        // Attach autocomplete handlers to input fields
        setupUniversityAutocomplete();
    }).catch(err => console.error("Error loading university data:", err));

    function setupUniversityAutocomplete() {
        const uniInputs = document.querySelectorAll('.searchable-select input');

        uniInputs.forEach(input => {
            const wrapper = input.parentElement;

            // Create dropdown list container if it doesn't exist
            let dropdown = wrapper.querySelector('.dropdown-list');
            if (!dropdown) {
                dropdown = document.createElement('div');
                dropdown.className = 'dropdown-list shadow-sm';
                dropdown.style.display = 'none';
                wrapper.appendChild(dropdown);
            }

            input.addEventListener('focus', function () {
                renderDropdown(this.value, dropdown, input);
            });

            input.addEventListener('input', function () {
                renderDropdown(this.value, dropdown, input);
            });

            // Close on click outside
            document.addEventListener('click', function (e) {
                if (!wrapper.contains(e.target)) {
                    dropdown.style.display = 'none';
                }
            });
        });
    }

    function renderDropdown(query, dropdown, input) {
        dropdown.innerHTML = '';
        const trimmed = query.trim().toLowerCase();

        const filtered = trimmed
            ? allUniversities.filter(u => u.name.toLowerCase().includes(trimmed))
            : allUniversities;

        if (filtered.length === 0) {
            dropdown.style.display = 'none';
            return;
        }

        dropdown.style.display = 'block';
        filtered.forEach(uni => {
            const div = document.createElement('div');
            div.className = 'dropdown-item';
            if (uni.isHighlight) {
                div.classList.add('highlight-uni');
            }
            div.textContent = uni.name;
            div.addEventListener('click', function () {
                input.value = uni.name;
                dropdown.style.display = 'none';
                // Trigger input validation/error clear
                input.classList.remove('is-invalid');
                const errDiv = input.parentElement.parentElement.querySelector('.invalid-feedback') || input.parentElement.parentElement.querySelector('.text-danger');
                if (errDiv) errDiv.style.display = 'none';
            });
            dropdown.appendChild(div);
        });
    }



    // ----------------------------------------------------
    // 10. Helper Functions for Cashfree Payment Flow
    // ----------------------------------------------------
    function loadCashfreeScript() {
        return new Promise((resolve) => {
            if (window.Cashfree) { resolve(true); return; }
            const script = document.createElement("script");
            script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    }

    // Modal Status Handlers
    window.openStatusModal = function (status, message = '', paymentId = 'N/A') {
        const modalEl = document.getElementById('paymentStatusModal');
        if (!modalEl) return;

        // Toggle state elements
        modalEl.querySelector('.status-processing').style.display = (status === 'processing') ? 'block' : 'none';
        modalEl.querySelector('.status-success').style.display = (status === 'success') ? 'block' : 'none';
        modalEl.querySelector('.status-failed').style.display = (status === 'failed') ? 'block' : 'none';

        // Toggle close button display (only on failure/success)
        const closeBtn = modalEl.querySelector('.btn-close');
        if (closeBtn) closeBtn.style.display = (status === 'failed') ? 'block' : 'none';

        if (status === 'processing') {
            modalEl.querySelector('.status-message').textContent = message || 'Processing your request...';
        } else if (status === 'success') {
            modalEl.querySelector('.txn-id').textContent = paymentId;
            const msgEl = modalEl.querySelector('.status-success .text-muted');
            if (msgEl) {
                msgEl.textContent = message || 'Your payment has been processed successfully.';
            }
        }

        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    };

    window.closeStatusModal = function () {
        const modalEl = document.getElementById('paymentStatusModal');
        if (modalEl) {
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
        }
    };

    // Verification logic with delay and status tracking
    async function verifyPayment(cf_order_id, formDetails, formElement) {
        console.log("Triggering /api/complete-payment for cf_order_id:", cf_order_id);
        openStatusModal('processing', 'Verifying payment...');

        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const verifyRes = await fetch(`${BASE_URL}/api/complete-payment`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cf_order_id: cf_order_id,
                    re_attempt_status: false,
                }),
            });

            const verifyData = await verifyRes.json();
            console.log("complete-payment response:", verifyData);

            if (verifyData.success) {
                console.log("Payment successful according to backend.");
                await postPaymentSuccess(cf_order_id, formDetails, formElement, verifyData);
            } else {
                console.warn("Payment verification failed.", verifyData.message || "Unknown error");
                openStatusModal('failed', verifyData.message || 'Payment verification failed.');
            }
        } catch (err) {
            console.error("complete-payment error:", err);
            openStatusModal('failed', 'Network error during verification.');
        }
    }

    // Auto registration and login after payment success
    async function postPaymentSuccess(cfOrderId, formDetails, formElement, verifyData) {
        if (formElement) {
            formElement.reset();
            formElement.querySelectorAll('.is-invalid, .referral-verified').forEach(el => {
                el.classList.remove('is-invalid', 'referral-verified');
                el.readOnly = false;
            });
            formElement.querySelectorAll('.invalid-feedback, .text-danger').forEach(el => {
                el.style.display = 'none';
                el.textContent = '';
            });
        }

        // Call createStudentAccount after payment is successful
        await createStudentAccount(cfOrderId, formDetails);
    }

    async function createStudentAccount(pid = 'DIRECT_CCS', formDetails) {
        console.log("Creating student account with pid:", pid, "and details:", formDetails);
        openStatusModal('processing', 'Creating your account...');
        try {
            const studentRes = await fetch(`${API_BASE}/api/users/create_student/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "full_name": formDetails.name,
                    "email": formDetails.email,
                    "city": formDetails.city,
                    "state": formDetails.state,
                    "country": "India",
                    "phone1": formDetails.phone,
                    "referred_code": formDetails.referral_code || formDetails.referredBy || ""
                }),
            }).then(res => res.json());

            console.log("createStudentAccount response:", studentRes);

            if (pid === 'REFERRAL_CODE') {
                // Referral code: do nothing
            } else {
                openStatusModal('success', 'Registration Successful! Redirecting to profile...', pid);
                setTimeout(() => {
                }, 3000);
            }
        } catch (err) {
            console.error("[DIRECT_CREATE] Error:", err);
            if (pid === 'REFERRAL_CODE') {
                // Referral code: do nothing
            } else {
                openStatusModal('success', 'Registration Successful! Redirecting to profile...', pid);
                setTimeout(() => {
                }, 3000);
            }
        }
    }

    // Capture UTM params
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return '';
    }

    function getTrackingParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const trackingKeys = [
            'utm_medium',
            'utm_source',
            'utm_campaign',
            'utm_content',
            'fbc_id',
            'utm_adname',
            'campaign_id',
            'adset_id',
            'fbclid',
            'ad_source',
            'ad_id',
            'utm_adgroupid',
            'utm_creativeid',
            'utm_matchtype',
            'utm_device',
            'utm_network',
            'utm_keyword',
            'gad_source',
            'gad_campaignid',
            'gbraid',
            'gclid'
        ];
        const params = {};
        trackingKeys.forEach(key => {
            const val = urlParams.get(key) || getCookie(key);
            if (val) {
                params[key] = val;
            }
        });
        return params;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source') || getCookie('utm_source') || '';
    const utmMedium = urlParams.get('utm_medium') || getCookie('utm_medium') || '';
    const utmCampaign = urlParams.get('utm_campaign') || getCookie('utm_campaign') || '';

    // Validator Functions
    function validateFormInputs(form) {
        let isValid = true;

        // Names
        const nameInput = form.querySelector('input[placeholder="Enter your full name"]');
        if (nameInput) {
            const val = nameInput.value.trim();
            const err = nameInput.parentElement.querySelector('.text-danger') || nameInput.parentElement.querySelector('.invalid-feedback');
            if (err) { err.textContent = ''; err.style.display = 'none'; }
            nameInput.classList.remove('is-invalid');

            if (!val) {
                nameInput.classList.add('is-invalid');
                if (err) { err.textContent = "Full name is required"; err.style.display = 'block'; }
                isValid = false;
            } else if (!/^[a-zA-Z\s]+$/.test(val)) {
                nameInput.classList.add('is-invalid');
                if (err) { err.textContent = "Name should contain only letters and spaces"; err.style.display = 'block'; }
                isValid = false;
            }
        }

        // Email
        const emailInput = form.querySelector('input[type="email"]');
        if (emailInput) {
            const val = emailInput.value.trim();
            const err = emailInput.parentElement.querySelector('.text-danger') || emailInput.parentElement.querySelector('.invalid-feedback');
            if (err) { err.textContent = ''; err.style.display = 'none'; }
            emailInput.classList.remove('is-invalid');

            if (!val) {
                emailInput.classList.add('is-invalid');
                if (err) { err.textContent = "Email address is required"; err.style.display = 'block'; }
                isValid = false;
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                emailInput.classList.add('is-invalid');
                if (err) { err.textContent = "Please enter a valid email"; err.style.display = 'block'; }
                isValid = false;
            }
        }

        // Phone
        const phoneInput = form.querySelector('input[type="tel"]');
        if (phoneInput) {
            const val = phoneInput.value.trim();
            const err = phoneInput.parentElement.querySelector('.text-danger') || phoneInput.parentElement.querySelector('.invalid-feedback');
            if (err) { err.textContent = ''; err.style.display = 'none'; }
            phoneInput.classList.remove('is-invalid');

            if (!val) {
                phoneInput.classList.add('is-invalid');
                if (err) { err.textContent = "Phone number is required"; err.style.display = 'block'; }
                isValid = false;
            } else if (!/^[6-9]\d{9}$/.test(val)) {
                phoneInput.classList.add('is-invalid');
                if (err) { err.textContent = "Please enter a valid 10-digit mobile number"; err.style.display = 'block'; }
                isValid = false;
            }
        }

        // State
        const stateSelect = form.querySelector('.state-select');
        if (stateSelect) {
            const val = stateSelect.value;
            const err = stateSelect.parentElement.querySelector('.text-danger') || stateSelect.parentElement.querySelector('.invalid-feedback');
            if (err) { err.textContent = ''; err.style.display = 'none'; }
            stateSelect.classList.remove('is-invalid');

            if (!val) {
                stateSelect.classList.add('is-invalid');
                if (err) { err.textContent = "State is required"; err.style.display = 'block'; }
                isValid = false;
            }
        }

        // City
        const citySelect = form.querySelector('.city-select');
        if (citySelect) {
            const val = citySelect.value;
            const err = citySelect.parentElement.querySelector('.text-danger') || citySelect.parentElement.querySelector('.invalid-feedback');
            if (err) { err.textContent = ''; err.style.display = 'none'; }
            citySelect.classList.remove('is-invalid');

            if (!val) {
                citySelect.classList.add('is-invalid');
                if (err) { err.textContent = "City is required"; err.style.display = 'block'; }
                isValid = false;
            }
        }

        // University
        const uniInput = form.querySelector('.searchable-select.uni-select input') || form.querySelector('.searchable-select input');
        if (uniInput) {
            const val = uniInput.value.trim();
            const err = uniInput.parentElement.parentElement.querySelector('.text-danger');
            if (err) { err.textContent = ''; err.style.display = 'none'; }
            uniInput.classList.remove('is-invalid');

            if (!val) {
                uniInput.classList.add('is-invalid');
                if (err) { err.textContent = "University is required"; err.style.display = 'block'; }
                isValid = false;
            }
        }

        // Referred By
        const refInput = form.querySelector('input[placeholder="Enter referrer\'s name"]');
        if (refInput) {
            const val = refInput.value.trim();
            const err = refInput.parentElement.querySelector('.text-danger');
            if (err) { err.textContent = ''; err.style.display = 'none'; }
            refInput.classList.remove('is-invalid');

            // Make it mandatory only if it has a required attribute
            const isMandatory = refInput.hasAttribute('required');
            if (isMandatory && !val) {
                refInput.classList.add('is-invalid');
                if (err) { err.textContent = "Referred by is required"; err.style.display = 'block'; }
                isValid = false;
            }
        }

        // Consent Checkbox
        const consentCheck = form.querySelector('#commerceCheckHero') || form.querySelector('#commerceCheckApply');
        if (consentCheck) {
            const err = form.querySelector('.isCommerceGraduate-error') || form.querySelector('.mb-3 .text-danger');
            if (err) { err.textContent = ''; err.style.display = 'none'; }

            if (!consentCheck.checked) {
                if (err) { err.textContent = "You must agree to the Terms and Privacy Policy"; err.style.display = 'block'; }
                isValid = false;
            }
        }

        return isValid;
    }

    // ----------------------------------------------------
    // 11. Hero Section Form Submit Handler (Cashfree Integrated)
    // ----------------------------------------------------
    const heroApplyForm = document.querySelector('.apply-form');
    if (heroApplyForm) {
        heroApplyForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            if (!validateFormInputs(this)) return;

            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Processing...';

            const fullName = this.querySelector('input[placeholder="Enter your full name"]').value.trim();
            const email = this.querySelector('input[type="email"]').value.trim();
            const phone = this.querySelector('input[type="tel"]').value.trim();
            const state = this.querySelector('.state-select').value;
            const city = this.querySelector('.city-select').value;
            const university = this.querySelector('.uni-select input').value.trim();
            const referredBy = this.querySelector('input[placeholder="Enter referrer\'s name"]').value.trim();

            const formDetails = { name: fullName, email, phone, state, city, university, referredBy };

            try {
                const payload = {
                    full_name: fullName,
                    email: email,
                    phone: phone,
                    state: state,
                    city: city,
                    university: university,
                    program: 2, // Default program 2
                    reffered_by: referredBy,
                    source: 18, // Source 18
                    source_form: 1, // Apply form
                    utm_source: utmSource,
                    utm_medium: utmMedium,
                    utm_campaign: utmCampaign,
                    ...getTrackingParams()
                };

                const response = await fetch(`${API_BASE}/api/career/createdossierform`, {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const dossierData = await response.json();

                if (dossierData.success) {
                    const formId = dossierData.data.id;

                    // Trigger Lead saved logging
                    fetch(`${BASE_URL}/api/save-lead`, {
                        method: "POST",
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: fullName,
                            email: email,
                            mobile: phone,
                            state: state,
                            city: city,
                            program: 2,
                            reffered_by: referredBy,
                            form_type: 2,
                            form_id: formId,
                            action: 'pay_now',
                            utm_source: utmSource,
                            utm_medium: utmMedium,
                            utm_campaign: utmCampaign,
                            source:18,
                            ...getTrackingParams()
                        })
                    }).catch(() => { });

                    // 3. Initiate payment status modal
                    openStatusModal('processing', 'Initializing payment...');

                    // 4. Call /api/start-payment
                    const startRes = await fetch(`${BASE_URL}/api/start-payment`, {
                        method: "POST",
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            user_id: null,
                            name: fullName,
                            email: email,
                            mobile: phone,
                            city: city,
                            state: state,
                            form_type: 2,
                            form_id: formId,
                            source: 18
                        })
                    });
                    const startData = await startRes.json();

                    if (!startData.success) {
                        closeStatusModal();
                        alert(startData.message || 'Payment initiation failed');
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalText;
                        return;
                    }

                    // 5. Load Cashfree SDK and checkout
                    const sdkLoaded = await loadCashfreeScript();
                    if (!sdkLoaded || !window.Cashfree) {
                        closeStatusModal();
                        alert("Cashfree SDK failed to load");
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalText;
                        return;
                    }

                    const cfMode = startData.environment === 'PRODUCTION' ? 'production' : 'sandbox';
                    const cashfree = window.Cashfree({ mode: cfMode });

                    cashfree.checkout({
                        paymentSessionId: startData.payment_session_id,
                        redirectTarget: "_modal"
                    }).then(async (result) => {
                        if (result.error) {
                            openStatusModal('failed', result.error?.message || 'Payment failed');
                            // Report failure in background
                            fetch(`${BASE_URL}/api/report-payment-failure`, {
                                method: "POST",
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    cf_order_id: startData.cf_order_id,
                                    cf_payment_id: result.error?.payment_id || null,
                                    re_attempt_status: false,
                                    error_code: result.error?.code,
                                    error_description: result.error?.message,
                                    error_source: result.error?.source,
                                    source: 18
                                })
                            }).catch(() => { });
                        } else if (result.paymentDetails) {
                            console.log("Cashfree checkout success (via result object):", result.paymentDetails);
                            verifyPayment(startData.cf_order_id, formDetails, heroApplyForm);
                        } else if (result.redirect) {
                            console.log("Cashfree checkout redirecting...");
                        } else {
                            console.log("Cashfree checkout finished without specific result. Verifying order status...");
                            verifyPayment(startData.cf_order_id, formDetails, heroApplyForm);
                        }
                    });

                } else {
                    alert(dossierData.message || 'Failed to submit form details.');
                }
            } catch (err) {
                console.error("Submission failed:", err);
                alert("Server error. Please try again later.");
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }

});

