<template>
  <div class="modal fade show d-block" tabindex="-1" @click.self="$emit('close')">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-key"></i>
            {{ $t('terminal.sshKeys') }}
          </h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">
          <div class="key-actions mb-3">
            <button class="btn btn-sm btn-primary" @click="showUploadForm = true">
              <i class="bi bi-upload"></i>
              {{ $t('terminal.uploadKey') }}
            </button>
            <button class="btn btn-sm btn-success" @click="showGenerateForm = true">
              <i class="bi bi-plus-circle"></i>
              {{ $t('terminal.generateKey') }}
            </button>
          </div>

          <!-- Upload Form -->
          <div v-if="showUploadForm" class="card mb-3">
            <div class="card-body">
              <h6>
                <i class="bi bi-upload"></i>
                Upload SSH Key Pair
              </h6>

              <!-- INFO BOX -->
              <div class="alert alert-info mb-3" role="alert">
                <h6 class="alert-heading">
                  <i class="bi bi-info-circle-fill"></i>
                  Supported Key Formats (All Platforms)
                </h6>
                <div class="row">
                  <div class="col-md-6">
                    <p class="mb-1"><strong>✅ Private Key Formats:</strong></p>
                    <ul class="small mb-2">
                      <li><code>-----BEGIN OPENSSH PRIVATE KEY-----</code></li>
                      <li><code>-----BEGIN RSA PRIVATE KEY-----</code></li>
                      <li><code>-----BEGIN EC PRIVATE KEY-----</code></li>
                      <li><code>-----BEGIN PRIVATE KEY-----</code> (PKCS#8)</li>
                      <li><code>-----BEGIN ENCRYPTED PRIVATE KEY-----</code></li>
                    </ul>
                  </div>
                  <div class="col-md-6">
                    <p class="mb-1"><strong>📁 Common Locations:</strong></p>
                    <ul class="small mb-2">
                      <li><strong>macOS/Linux:</strong> <code>~/.ssh/</code></li>
                      <li><strong>Windows:</strong> <code>C:\Users\[user]\.ssh\</code></li>
                    </ul>
                    <p class="mb-1"><strong>📝 Common Files:</strong></p>
                    <ul class="small mb-0">
                      <li><code>id_rsa</code>, <code>id_ed25519</code>, <code>id_ecdsa</code></li>
                      <li><code>id_rsa.pub</code> (public key - optional)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <form @submit.prevent="handleUpload">
                <!-- Key Name -->
                <div class="mb-3">
                  <label class="form-label fw-bold">
                    <i class="bi bi-tag"></i>
                    Key Name *
                  </label>
                  <input
                    type="text"
                    class="form-control"
                    v-model="uploadForm.name"
                    placeholder="e.g., Production Server Key"
                    required
                  />
                  <small class="text-muted">Give this key a memorable name</small>
                </div>

                <!-- Private Key Upload -->
                <div class="mb-3">
                  <label class="form-label fw-bold">
                    <i class="bi bi-file-earmark-lock-fill text-danger"></i>
                    Private Key * (Required)
                  </label>

                  <!-- File Upload -->
                  <div class="input-group mb-2">
                    <input
                      type="file"
                      class="form-control"
                      @change="handlePrivateKeyFile"
                      ref="privateKeyInput"
                    />
                    <button
                      v-if="uploadForm.private_key"
                      type="button"
                      class="btn btn-outline-danger"
                      @click="clearPrivateKey"
                      title="Clear private key"
                    >
                      <i class="bi bi-x-lg"></i>
                    </button>
                  </div>
                  <small class="text-muted">
                    <i class="bi bi-info-circle"></i>
                    Accepts any file format - macOS keys (id_rsa, id_ed25519), .pem, .key, etc.
                  </small>

                  <!-- Status -->
                  <div v-if="privateKeyStatus" class="alert mb-2" :class="privateKeyStatus.class">
                    <i class="bi" :class="privateKeyStatus.icon"></i>
                    {{ privateKeyStatus.message }}
                  </div>

                  <!-- Or Paste -->
                  <div class="form-check mb-2">
                    <input class="form-check-input" type="checkbox" v-model="showPrivateKeyTextarea" id="pastePrivateKey">
                    <label class="form-check-label" for="pastePrivateKey">
                      Or paste private key manually
                    </label>
                  </div>

                  <textarea
                    v-if="showPrivateKeyTextarea"
                    class="form-control font-monospace small"
                    v-model="uploadForm.private_key"
                    rows="8"
                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END OPENSSH PRIVATE KEY-----"
                  ></textarea>
                </div>

                <!-- Public Key Upload (Optional) -->
                <div class="mb-3">
                  <label class="form-label fw-bold">
                    <i class="bi bi-file-earmark-text text-success"></i>
                    Public Key (Optional)
                  </label>
                  <small class="text-muted d-block mb-2">
                    <i class="bi bi-lightbulb"></i>
                    If not provided, we'll try to generate it from the private key
                  </small>

                  <!-- File Upload -->
                  <div class="input-group mb-2">
                    <input
                      type="file"
                      class="form-control"
                      @change="handlePublicKeyFile"
                      ref="publicKeyInput"
                    />
                    <button
                      v-if="uploadForm.public_key"
                      type="button"
                      class="btn btn-outline-secondary"
                      @click="clearPublicKey"
                      title="Clear public key"
                    >
                      <i class="bi bi-x-lg"></i>
                    </button>
                  </div>

                  <!-- Status -->
                  <div v-if="publicKeyStatus" class="alert mb-2" :class="publicKeyStatus.class">
                    <i class="bi" :class="publicKeyStatus.icon"></i>
                    {{ publicKeyStatus.message }}
                  </div>

                  <!-- Or Paste -->
                  <div class="form-check mb-2">
                    <input class="form-check-input" type="checkbox" v-model="showPublicKeyTextarea" id="pastePublicKey">
                    <label class="form-check-label" for="pastePublicKey">
                      Or paste public key manually
                    </label>
                  </div>

                  <textarea
                    v-if="showPublicKeyTextarea"
                    class="form-control font-monospace small"
                    v-model="uploadForm.public_key"
                    rows="3"
                    placeholder="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ... user@hostname"
                  ></textarea>
                </div>

                <!-- Passphrase (Optional) -->
                <div class="mb-3">
                  <label class="form-label fw-bold">
                    <i class="bi bi-shield-lock"></i>
                    Passphrase (Optional)
                  </label>
                  <input
                    type="password"
                    class="form-control"
                    v-model="uploadForm.passphrase"
                    placeholder="Enter passphrase if your key is encrypted"
                  />
                  <small class="text-muted">
                    <i class="bi bi-info-circle"></i>
                    Only needed if your private key is encrypted with a passphrase
                  </small>
                </div>

                <!-- Actions -->
                <div class="d-flex gap-2">
                  <button type="submit" class="btn btn-primary" :disabled="!uploadForm.private_key">
                    <i class="bi bi-upload"></i>
                    Upload Key
                  </button>
                  <button type="button" class="btn btn-secondary" @click="cancelUpload">
                    <i class="bi bi-x-circle"></i>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Generate Form -->
          <div v-if="showGenerateForm" class="card mb-3">
            <div class="card-body">
              <h6>{{ $t('terminal.generateKey') }}</h6>
              <form @submit.prevent="handleGenerate">
                <div class="mb-2">
                  <label class="form-label">{{ $t('terminal.keyName') }}</label>
                  <input
                    type="text"
                    class="form-control form-control-sm"
                    v-model="generateForm.name"
                    required
                  />
                </div>
                <div class="mb-2">
                  <label class="form-label">{{ $t('terminal.keyType') }}</label>
                  <select class="form-select form-select-sm" v-model="generateForm.type">
                    <option value="rsa">RSA 4096</option>
                    <option value="ed25519">ED25519</option>
                  </select>
                </div>
                <div class="mb-2">
                  <label class="form-label">{{ $t('terminal.passphrase') }} ({{ $t('common.optional') }})</label>
                  <input
                    type="password"
                    class="form-control form-control-sm"
                    v-model="generateForm.passphrase"
                  />
                </div>
                <div class="d-flex gap-2">
                  <button type="submit" class="btn btn-sm btn-success">
                    {{ $t('common.generate') }}
                  </button>
                  <button type="button" class="btn btn-sm btn-secondary" @click="cancelGenerate">
                    {{ $t('common.cancel') }}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Keys List -->
          <div class="keys-list">
            <div v-if="loading" class="text-center py-3">
              <div class="spinner-border spinner-border-sm" role="status"></div>
            </div>

            <div v-else-if="keys.length === 0" class="empty-state">
              <i class="bi bi-key"></i>
              <p>{{ $t('terminal.noKeys') }}</p>
            </div>

            <div v-else class="table-responsive">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>{{ $t('terminal.name') }}</th>
                    <th>{{ $t('terminal.fingerprint') }}</th>
                    <th>{{ $t('terminal.created') }}</th>
                    <th>{{ $t('common.actions') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="key in keys" :key="key.id">
                    <td>
                      <i class="bi bi-key me-2"></i>
                      {{ key.name }}
                    </td>
                    <td>
                      <code class="fingerprint">{{ key.fingerprint }}</code>
                    </td>
                    <td>{{ formatDate(key.created_at) }}</td>
                    <td>
                      <button
                        class="btn btn-sm btn-outline-primary me-1"
                        @click="viewPublicKey(key)"
                        :title="$t('terminal.viewPublicKey')"
                      >
                        <i class="bi bi-eye"></i>
                      </button>
                      <button
                        class="btn btn-sm btn-outline-warning me-1"
                        @click="editPassphrase(key)"
                        title="Edit Passphrase"
                      >
                        <i class="bi bi-shield-lock"></i>
                      </button>
                      <button
                        class="btn btn-sm btn-outline-danger"
                        @click="deleteKey(key)"
                        :title="$t('common.delete')"
                      >
                        <i class="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="modal-backdrop fade show"></div>

  <!-- View Key Modal -->
  <div v-if="showKeyModal" class="modal fade show d-block" tabindex="-1" style="z-index: 1060;">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-key"></i>
            {{ keyModalTitle }}
          </h5>
          <button type="button" class="btn-close" @click="closeKeyModal"></button>
        </div>
        <div class="modal-body">
          <div v-if="keyModalData.private_key" class="mb-3">
            <label class="form-label fw-bold">
              <i class="bi bi-shield-lock"></i>
              Private Key
            </label>
            <div class="key-display-container">
              <textarea
                class="form-control font-monospace"
                :value="keyModalData.private_key"
                readonly
                rows="10"
                style="font-size: 12px;"
              ></textarea>
              <button
                class="btn btn-sm btn-outline-primary mt-2"
                @click="copyToClipboard(keyModalData.private_key, 'Private key')"
              >
                <i class="bi bi-clipboard"></i>
                Copy Private Key
              </button>
              <button
                class="btn btn-sm btn-outline-success mt-2 ms-2"
                @click="downloadKey(keyModalData.private_key, keyModalData.name, 'private')"
              >
                <i class="bi bi-download"></i>
                Download Private Key
              </button>
            </div>
          </div>

          <div v-if="keyModalData.public_key" class="mb-3">
            <label class="form-label fw-bold">
              <i class="bi bi-key"></i>
              Public Key
            </label>
            <div class="key-display-container">
              <textarea
                class="form-control font-monospace"
                :value="keyModalData.public_key"
                readonly
                rows="3"
                style="font-size: 12px;"
              ></textarea>
              <button
                class="btn btn-sm btn-outline-primary mt-2"
                @click="copyToClipboard(keyModalData.public_key, 'Public key')"
              >
                <i class="bi bi-clipboard"></i>
                Copy Public Key
              </button>
              <button
                class="btn btn-sm btn-outline-success mt-2 ms-2"
                @click="downloadKey(keyModalData.public_key, keyModalData.name, 'public')"
              >
                <i class="bi bi-download"></i>
                Download Public Key
              </button>
            </div>
          </div>

          <div v-if="keyModalData.fingerprint" class="alert alert-info">
            <strong>Fingerprint:</strong> <code>{{ keyModalData.fingerprint }}</code>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeKeyModal">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
  <div v-if="showKeyModal" class="modal-backdrop fade show" style="z-index: 1055;"></div>

  <!-- Edit Passphrase Modal -->
  <div v-if="showEditPassphraseModal" class="modal fade show d-block" tabindex="-1" style="z-index: 1060;">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-shield-lock"></i>
            Edit Passphrase
          </h5>
          <button type="button" class="btn-close" @click="closeEditPassphraseModal"></button>
        </div>
        <div class="modal-body">
          <p class="text-muted mb-3">
            <i class="bi bi-info-circle"></i>
            Update the passphrase for: <strong>{{ editPassphraseForm.keyName }}</strong>
          </p>
          <form @submit.prevent="handleUpdatePassphrase">
            <div class="mb-3">
              <label class="form-label fw-bold">
                <i class="bi bi-shield-lock"></i>
                Passphrase
              </label>
              <input
                type="password"
                class="form-control"
                v-model="editPassphraseForm.passphrase"
                placeholder="Enter passphrase (leave empty to remove)"
                autocomplete="new-password"
              />
              <small class="text-muted">
                <i class="bi bi-info-circle"></i>
                Enter the passphrase for this encrypted key, or leave empty to remove it
              </small>
            </div>
            <div class="d-flex gap-2">
              <button type="submit" class="btn btn-primary">
                <i class="bi bi-check-circle"></i>
                Update Passphrase
              </button>
              <button type="button" class="btn btn-secondary" @click="closeEditPassphraseModal">
                <i class="bi bi-x-circle"></i>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
  <div v-if="showEditPassphraseModal" class="modal-backdrop fade show" style="z-index: 1055;"></div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import api from '../../services/api';

export default {
  name: 'KeyManager',
  emits: ['close'],
  setup(props, { emit }) {
    const keys = ref([]);
    const loading = ref(false);
    const showUploadForm = ref(false);
    const showGenerateForm = ref(false);
    const showKeyModal = ref(false);
    const showEditPassphraseModal = ref(false);
    const keyModalTitle = ref('');
    const keyModalData = ref({
      name: '',
      private_key: '',
      public_key: '',
      fingerprint: ''
    });

    const editPassphraseForm = ref({
      keyId: null,
      keyName: '',
      passphrase: ''
    });

    const uploadForm = ref({
      name: '',
      private_key: '',
      public_key: '',
      passphrase: '',
    });

    const generateForm = ref({
      name: '',
      type: 'ed25519',
      passphrase: '',
    });

    const loadKeys = async () => {
      loading.value = true;
      try {
        const response = await api.get('/ssh-keys');
        keys.value = response.data;
      } catch (error) {
        console.error('Failed to load keys:', error);
      } finally {
        loading.value = false;
      }
    };

    const handleUpload = async () => {
      try {
        console.log('🚀 UPLOAD STARTED');
        console.log('📋 Form data:', {
          name: uploadForm.value.name,
          private_key_length: uploadForm.value.private_key?.length || 0,
          public_key_length: uploadForm.value.public_key?.length || 0,
          has_passphrase: !!uploadForm.value.passphrase
        });

        // Validate required fields
        if (!uploadForm.value.name) {
          alert('❌ Please enter a name for the SSH key');
          return;
        }

        if (!uploadForm.value.private_key && !uploadForm.value.public_key) {
          alert('❌ No key data found!\n\nPlease:\n1. Click "Choose File" and select your private key file, OR\n2. Paste your private key in the text area');
          return;
        }

        // Trim whitespace
        const privateKey = uploadForm.value.private_key?.trim() || '';
        const publicKey = uploadForm.value.public_key?.trim() || '';

        console.log('🔍 After trim - Private key length:', privateKey.length);
        console.log('🔍 After trim - Public key length:', publicKey.length);

        // Check if user uploaded public key instead of private key
        if (privateKey && (privateKey.startsWith('ssh-rsa') || privateKey.startsWith('ssh-ed25519') || privateKey.startsWith('ecdsa-'))) {
          alert('❌ You uploaded a PUBLIC key in the private key field!\n\nPlease:\n1. Upload your PRIVATE key (id_rsa, id_ed25519) in the "Upload from File" field\n2. Upload your PUBLIC key (id_rsa.pub, id_ed25519.pub) in the "Public Key" field');
          return;
        }

        // Validate private key format if provided
        if (privateKey && (!privateKey.includes('BEGIN') || !privateKey.includes('PRIVATE KEY'))) {
          alert('❌ Invalid private key format.\n\nThe private key must contain:\n- "BEGIN" marker\n- "PRIVATE KEY" text\n\nExample:\n-----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----');
          return;
        }

        // Must have private key
        if (!privateKey) {
          alert('❌ Private key is required!\n\nPlease upload your PRIVATE key file (id_rsa, id_ed25519, etc.)');
          return;
        }

        console.log('✅ Validation passed!');
        console.log('📤 Uploading SSH key:', uploadForm.value.name);
        console.log('Private key length:', privateKey.length);
        console.log('Public key length:', publicKey.length);
        console.log('Private key type:',
          privateKey.includes('OPENSSH') ? 'OpenSSH' :
          privateKey.includes('RSA') ? 'RSA' :
          privateKey.includes('EC') ? 'ECDSA' :
          privateKey.includes('ED25519') ? 'ED25519' : 'Unknown'
        );

        // Use provided public key or try to extract/generate
        let finalPublicKey = publicKey;
        if (!finalPublicKey) {
          finalPublicKey = extractPublicKey(privateKey);
        }

        const payload = {
          name: uploadForm.value.name,
          private_key: privateKey,
          public_key: finalPublicKey,
          has_passphrase: !!uploadForm.value.passphrase,
          passphrase: uploadForm.value.passphrase || undefined,
        };

        console.log('📦 Payload ready:', {
          name: payload.name,
          private_key: '[REDACTED]',
          public_key: finalPublicKey ? finalPublicKey.substring(0, 30) + '...' : 'PLACEHOLDER',
          has_passphrase: payload.has_passphrase
        });

        const response = await api.post('/ssh-keys', payload);
        console.log('✅ SSH key uploaded successfully:', response.data);

        await loadKeys();
        cancelUpload();
        alert('✅ SSH key uploaded successfully!\n\nKey: ' + response.data.name + '\nType: ' + response.data.key_type.toUpperCase());
      } catch (error) {
        console.error('❌ Failed to upload key:', error);
        console.error('Error response:', error.response?.data);

        const errorData = error.response?.data;
        let errorMsg = errorData?.error || error.message;

        // Check for common errors and provide helpful messages
        if (errorMsg.includes('DECODER routines::unsupported') || errorMsg.includes('Invalid SSH key')) {
          errorMsg = '❌ INVALID KEY FORMAT!\n\n' +
            '⚠️  You may have uploaded a PUBLIC key instead of a PRIVATE key.\n\n' +
            '✅ Please upload your PRIVATE key file:\n' +
            '   • ~/.ssh/id_rsa (NOT id_rsa.pub)\n' +
            '   • ~/.ssh/id_ed25519 (NOT id_ed25519.pub)\n\n' +
            '🔍 Private keys start with:\n' +
            '   -----BEGIN OPENSSH PRIVATE KEY-----\n' +
            '   -----BEGIN RSA PRIVATE KEY-----\n' +
            '   -----BEGIN PRIVATE KEY-----\n\n' +
            'Original error: ' + errorMsg;
        }

        // If backend needs passphrase
        if (errorData?.needsPassphrase) {
          errorMsg = '🔐 ENCRYPTED KEY DETECTED!\n\n' +
            'Your private key is encrypted with a passphrase.\n\n' +
            'Please either:\n' +
            '1. Enter the passphrase in the "Passphrase" field, OR\n' +
            '2. Upload your public key (.pub file) manually\n\n' +
            'Original error: ' + errorMsg;
        }

        // If backend needs public key
        if (errorData?.needsPublicKey) {
          errorMsg += '\n\n📝 Please upload or paste your public key (.pub file) in the "Public Key" field.';
        }

        alert('Failed to upload key:\n\n' + errorMsg);
      }
    };

    const extractPublicKey = (privateKey) => {
      // Try to extract public key from private key
      // For OpenSSH format, public key is often at the end
      const lines = privateKey.split('\n');
      const publicKeyLine = lines.find(line =>
        line.startsWith('ssh-rsa') ||
        line.startsWith('ssh-ed25519') ||
        line.startsWith('ecdsa-')
      );

      if (publicKeyLine) {
        return publicKeyLine;
      }

      // If not found, return a placeholder - backend will generate it
      return 'ssh-rsa PLACEHOLDER';
    };

    const handleGenerate = async () => {
      try {
        // Validate required fields
        if (!generateForm.value.name) {
          alert('Please enter a name for the SSH key');
          return;
        }

        console.log('Generating SSH key:', generateForm.value.name, 'Type:', generateForm.value.type);

        const response = await api.post('/ssh-keys/generate', generateForm.value);
        console.log('SSH key generated successfully:', response.data);

        await loadKeys();

        // Show generated keys in modal
        keyModalTitle.value = `Generated SSH Key: ${generateForm.value.name}`;
        keyModalData.value = {
          name: generateForm.value.name,
          private_key: response.data.private_key,
          public_key: response.data.public_key,
          fingerprint: response.data.fingerprint
        };
        showKeyModal.value = true;

        cancelGenerate();
      } catch (error) {
        console.error('Failed to generate key:', error);
        alert('Failed to generate key: ' + error.message);
      }
    };

    const deleteKey = async (key) => {
      if (!confirm(`Delete SSH key "${key.name}"?`)) {
        return;
      }

      try {
        await api.delete(`/ssh-keys/${key.id}`);
        await loadKeys();
      } catch (error) {
        console.error('Failed to delete key:', error);
        alert('Failed to delete key: ' + error.message);
      }
    };

    const viewPublicKey = async (key) => {
      try {
        const response = await api.get(`/ssh-keys/${key.id}/public`);

        // Show in modal
        keyModalTitle.value = `SSH Key: ${key.name}`;
        keyModalData.value = {
          name: key.name,
          private_key: '', // Don't show private key for existing keys
          public_key: response.data.public_key,
          fingerprint: key.fingerprint
        };
        showKeyModal.value = true;
      } catch (error) {
        console.error('Failed to get public key:', error);
        alert('Failed to get public key: ' + error.message);
      }
    };

    const closeKeyModal = () => {
      showKeyModal.value = false;
      keyModalData.value = {
        name: '',
        private_key: '',
        public_key: '',
        fingerprint: ''
      };
    };

    const editPassphrase = (key) => {
      editPassphraseForm.value = {
        keyId: key.id,
        keyName: key.name,
        passphrase: ''
      };
      showEditPassphraseModal.value = true;
    };

    const closeEditPassphraseModal = () => {
      showEditPassphraseModal.value = false;
      editPassphraseForm.value = {
        keyId: null,
        keyName: '',
        passphrase: ''
      };
    };

    const handleUpdatePassphrase = async () => {
      try {
        await api.put(`/ssh-keys/${editPassphraseForm.value.keyId}/passphrase`, {
          passphrase: editPassphraseForm.value.passphrase || null
        });

        alert('✅ Passphrase updated successfully!');
        closeEditPassphraseModal();
        await loadKeys();
      } catch (error) {
        console.error('Failed to update passphrase:', error);
        alert('❌ Failed to update passphrase: ' + error.message);
      }
    };

    const copyToClipboard = async (text, label) => {
      try {
        await navigator.clipboard.writeText(text);
        alert(`${label} copied to clipboard!`);
      } catch (error) {
        console.error('Failed to copy:', error);
        alert('Failed to copy to clipboard');
      }
    };

    const downloadKey = (content, name, type) => {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'private' ? `${name}` : `${name}.pub`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    };

    const privateKeyInput = ref(null);
    const publicKeyInput = ref(null);
    const privateKeyStatus = ref(null);
    const publicKeyStatus = ref(null);
    const showPrivateKeyTextarea = ref(false);
    const showPublicKeyTextarea = ref(false);

    // Validate key format
    const validatePrivateKey = (content) => {
      const trimmed = content.trim();

      // Check for private key markers
      const privateKeyMarkers = [
        '-----BEGIN OPENSSH PRIVATE KEY-----',
        '-----BEGIN RSA PRIVATE KEY-----',
        '-----BEGIN EC PRIVATE KEY-----',
        '-----BEGIN PRIVATE KEY-----',
        '-----BEGIN ENCRYPTED PRIVATE KEY-----',
        '-----BEGIN DSA PRIVATE KEY-----'
      ];

      const hasPrivateMarker = privateKeyMarkers.some(marker => trimmed.includes(marker));

      if (!hasPrivateMarker) {
        // Check if it's a public key
        if (trimmed.startsWith('ssh-rsa') || trimmed.startsWith('ssh-ed25519') ||
            trimmed.startsWith('ecdsa-') || trimmed.startsWith('ssh-dss')) {
          return {
            valid: false,
            error: 'This is a PUBLIC key! Please upload the PRIVATE key instead (without .pub extension)'
          };
        }
        return {
          valid: false,
          error: 'Invalid private key format. Must contain BEGIN/END PRIVATE KEY markers'
        };
      }

      // Determine key type
      let keyType = 'Unknown';
      if (trimmed.includes('BEGIN OPENSSH PRIVATE KEY')) keyType = 'OpenSSH';
      else if (trimmed.includes('BEGIN RSA PRIVATE KEY')) keyType = 'RSA';
      else if (trimmed.includes('BEGIN EC PRIVATE KEY')) keyType = 'ECDSA';
      else if (trimmed.includes('BEGIN ENCRYPTED PRIVATE KEY')) keyType = 'Encrypted PKCS#8';
      else if (trimmed.includes('BEGIN PRIVATE KEY')) keyType = 'PKCS#8';

      return {
        valid: true,
        keyType,
        size: trimmed.length
      };
    };

    const validatePublicKey = (content) => {
      const trimmed = content.trim();

      // Check for public key format
      const publicKeyPrefixes = ['ssh-rsa', 'ssh-ed25519', 'ecdsa-sha2-', 'ssh-dss'];
      const hasPublicPrefix = publicKeyPrefixes.some(prefix => trimmed.startsWith(prefix));

      if (!hasPublicPrefix) {
        // Check if it's a private key
        if (trimmed.includes('BEGIN') && trimmed.includes('PRIVATE KEY')) {
          return {
            valid: false,
            error: 'This is a PRIVATE key! Please upload it in the Private Key field above'
          };
        }
        return {
          valid: false,
          error: 'Invalid public key format. Must start with ssh-rsa, ssh-ed25519, or ecdsa-sha2-'
        };
      }

      // Determine key type
      let keyType = 'Unknown';
      if (trimmed.startsWith('ssh-rsa')) keyType = 'RSA';
      else if (trimmed.startsWith('ssh-ed25519')) keyType = 'ED25519';
      else if (trimmed.startsWith('ecdsa-sha2-')) keyType = 'ECDSA';
      else if (trimmed.startsWith('ssh-dss')) keyType = 'DSA';

      return {
        valid: true,
        keyType,
        size: trimmed.length
      };
    };

    const handlePrivateKeyFile = async (event) => {
      const file = event.target.files[0];
      if (!file) {
        privateKeyStatus.value = null;
        return;
      }

      console.log('📁 Private key file selected:', file.name, 'Size:', file.size);

      try {
        const text = await file.text();
        const validation = validatePrivateKey(text);

        if (!validation.valid) {
          privateKeyStatus.value = {
            class: 'alert-danger',
            icon: 'bi-x-circle-fill',
            message: validation.error
          };
          uploadForm.value.private_key = '';
          return;
        }

        uploadForm.value.private_key = text;
        privateKeyStatus.value = {
          class: 'alert-success',
          icon: 'bi-check-circle-fill',
          message: `✅ Valid ${validation.keyType} private key loaded (${validation.size} bytes)`
        };

        // Auto-fill name from filename if empty
        if (!uploadForm.value.name) {
          const fileName = file.name
            .replace(/^id_/, '')
            .replace(/\.(pem|key|ppk)$/, '')
            .replace(/_/g, ' ');
          uploadForm.value.name = fileName.charAt(0).toUpperCase() + fileName.slice(1);
        }

        console.log('✅ Private key loaded successfully');
      } catch (error) {
        console.error('❌ Failed to read private key file:', error);
        privateKeyStatus.value = {
          class: 'alert-danger',
          icon: 'bi-x-circle-fill',
          message: 'Failed to read file: ' + error.message
        };
      }
    };

    const handlePublicKeyFile = async (event) => {
      const file = event.target.files[0];
      if (!file) {
        publicKeyStatus.value = null;
        return;
      }

      console.log('📁 Public key file selected:', file.name, 'Size:', file.size);

      try {
        const text = await file.text();
        const validation = validatePublicKey(text);

        if (!validation.valid) {
          publicKeyStatus.value = {
            class: 'alert-danger',
            icon: 'bi-x-circle-fill',
            message: validation.error
          };
          uploadForm.value.public_key = '';
          return;
        }

        uploadForm.value.public_key = text;
        publicKeyStatus.value = {
          class: 'alert-success',
          icon: 'bi-check-circle-fill',
          message: `✅ Valid ${validation.keyType} public key loaded (${validation.size} bytes)`
        };

        console.log('✅ Public key loaded successfully');
      } catch (error) {
        console.error('❌ Failed to read public key file:', error);
        publicKeyStatus.value = {
          class: 'alert-danger',
          icon: 'bi-x-circle-fill',
          message: 'Failed to read file: ' + error.message
        };
      }
    };

    const clearPrivateKey = () => {
      uploadForm.value.private_key = '';
      privateKeyStatus.value = null;
      if (privateKeyInput.value) {
        privateKeyInput.value.value = '';
      }
    };

    const clearPublicKey = () => {
      uploadForm.value.public_key = '';
      publicKeyStatus.value = null;
      if (publicKeyInput.value) {
        publicKeyInput.value.value = '';
      }
    };

    const cancelUpload = () => {
      showUploadForm.value = false;
      uploadForm.value = { name: '', private_key: '', public_key: '', passphrase: '' };
      privateKeyStatus.value = null;
      publicKeyStatus.value = null;
      showPrivateKeyTextarea.value = false;
      showPublicKeyTextarea.value = false;
      if (privateKeyInput.value) {
        privateKeyInput.value.value = '';
      }
      if (publicKeyInput.value) {
        publicKeyInput.value.value = '';
      }
    };

    const cancelGenerate = () => {
      showGenerateForm.value = false;
      generateForm.value = { name: '', type: 'ed25519', passphrase: '' };
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString();
    };

    // Watch for manual paste in private key textarea
    watch(() => uploadForm.value.private_key, (newValue) => {
      if (newValue && showPrivateKeyTextarea.value) {
        const validation = validatePrivateKey(newValue);
        if (validation.valid) {
          privateKeyStatus.value = {
            class: 'alert-success',
            icon: 'bi-check-circle-fill',
            message: `✅ Valid ${validation.keyType} private key (${validation.size} bytes)`
          };
        } else if (newValue.trim().length > 0) {
          privateKeyStatus.value = {
            class: 'alert-danger',
            icon: 'bi-x-circle-fill',
            message: validation.error
          };
        } else {
          privateKeyStatus.value = null;
        }
      }
    });

    // Watch for manual paste in public key textarea
    watch(() => uploadForm.value.public_key, (newValue) => {
      if (newValue && showPublicKeyTextarea.value) {
        const validation = validatePublicKey(newValue);
        if (validation.valid) {
          publicKeyStatus.value = {
            class: 'alert-success',
            icon: 'bi-check-circle-fill',
            message: `✅ Valid ${validation.keyType} public key (${validation.size} bytes)`
          };
        } else if (newValue.trim().length > 0) {
          publicKeyStatus.value = {
            class: 'alert-danger',
            icon: 'bi-x-circle-fill',
            message: validation.error
          };
        } else {
          publicKeyStatus.value = null;
        }
      }
    });

    onMounted(() => {
      loadKeys();
    });

    return {
      keys,
      loading,
      showUploadForm,
      showGenerateForm,
      showKeyModal,
      showEditPassphraseModal,
      keyModalTitle,
      keyModalData,
      editPassphraseForm,
      uploadForm,
      generateForm,
      privateKeyInput,
      publicKeyInput,
      privateKeyStatus,
      publicKeyStatus,
      showPrivateKeyTextarea,
      showPublicKeyTextarea,
      handleUpload,
      handleGenerate,
      handlePrivateKeyFile,
      handlePublicKeyFile,
      clearPrivateKey,
      clearPublicKey,
      deleteKey,
      viewPublicKey,
      closeKeyModal,
      editPassphrase,
      closeEditPassphraseModal,
      handleUpdatePassphrase,
      copyToClipboard,
      downloadKey,
      cancelUpload,
      cancelGenerate,
      formatDate,
    };
  },
};
</script>

<style scoped>
.modal {
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.modal-header {
  border-bottom: 1px solid var(--border-color);
}

.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
}

.empty-state {
  text-align: center;
  padding: 32px;
  color: var(--text-secondary);
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.fingerprint {
  font-size: 11px;
  color: var(--text-secondary);
}

.table {
  color: var(--text-primary);
}

.table thead {
  border-bottom: 2px solid var(--border-color);
}

.table tbody tr {
  border-bottom: 1px solid var(--border-color);
}

.form-control,
.form-select {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.form-control:focus,
.form-select:focus {
  background: var(--bg-primary);
  border-color: var(--primary-color);
  color: var(--text-primary);
}

.btn-close {
  filter: var(--bs-btn-close-white-filter);
}
</style>

