<template>
  <div class="admin-layout">
    <v-card class="admin-card" elevation="0">
      <v-card-item>
        <v-card-title class="admin-title">Admin</v-card-title>
        <v-card-subtitle>Whitelist for prosjektet</v-card-subtitle>
      </v-card-item>

      <v-card-text class="admin-body">
        <form class="email-form" @submit.prevent="addEmail">
          <v-text-field
            v-model="emailInput"
            label="E-post"
            type="email"
            variant="outlined"
            density="comfortable"
            hide-details
          />
          <v-btn
            color="var(--app-primary)"
            variant="flat"
            prepend-icon="mdi-plus"
            :loading="loading"
            type="submit"
          >
            Legg til
          </v-btn>
        </form>

        <p v-if="error" class="admin-error">{{ error }}</p>

        <div class="allowlist">
          <div v-for="entry in allowlist" :key="entry.id" class="allowlist-item">
            <span>{{ entry.email || entry.id }}</span>
            <v-btn
              icon="mdi-delete-outline"
              size="small"
              variant="text"
              color="#ba3d25"
              :disabled="loading"
              @click="removeEmail(entry.id)"
            />
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore'
import { db, normalizeEmail } from '../services/firebase'

const emailInput = ref('')
const allowlist = ref([])
const loading = ref(false)
const error = ref('')
let unsubscribe = null

function subscribeToAllowlist() {
  unsubscribe = onSnapshot(
    query(collection(db, 'allowlist'), orderBy('email')),
    (snapshot) => {
      allowlist.value = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...entry.data(),
      }))
    },
    (snapshotError) => {
      error.value = snapshotError.message || 'Kunne ikke laste whitelist.'
    },
  )
}

async function addEmail() {
  const email = normalizeEmail(emailInput.value)
  if (!email) return

  loading.value = true
  error.value = ''

  try {
    await setDoc(doc(db, 'allowlist', email), {
      email,
      createdAt: serverTimestamp(),
    })
    emailInput.value = ''
  } catch (saveError) {
    error.value = saveError.message || 'Kunne ikke legge til e-post.'
  } finally {
    loading.value = false
  }
}

async function removeEmail(email) {
  loading.value = true
  error.value = ''

  try {
    await deleteDoc(doc(db, 'allowlist', email))
  } catch (deleteError) {
    error.value = deleteError.message || 'Kunne ikke fjerne e-post.'
  } finally {
    loading.value = false
  }
}

onMounted(subscribeToAllowlist)
onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})
</script>

<style scoped>
.admin-layout {
  display: grid;
  gap: 14px;
}

.admin-card {
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: var(--app-card);
}

.admin-title {
  color: var(--app-ink);
}

.admin-body {
  display: grid;
  gap: 14px;
}

.email-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.allowlist {
  display: grid;
  gap: 8px;
}

.allowlist-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  padding: 8px 10px;
  background: color-mix(in srgb, var(--app-bg-soft) 65%, transparent);
  color: var(--app-ink);
  font-weight: 700;
}

.admin-error {
  margin: 0;
  color: #ba3d25;
  font-size: 13px;
  font-weight: 700;
}

@media (max-width: 700px) {
  .email-form {
    grid-template-columns: 1fr;
  }
}
</style>
