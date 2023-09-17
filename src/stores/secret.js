import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useSecretStore = defineStore('secret', () => {
  const secret = ref(null)
  const message = ref('*************')

  const setMessage = (msg) => {
    message.value = msg
  }

  const setSecret = (id) => {
    secret.value = id
  }

  return { message, setMessage, secret, setSecret }
})
