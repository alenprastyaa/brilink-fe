// src/composables/useSweetAlert.js
import Swal from 'sweetalert2'

export function useSweetAlert() {
  const showAlert = (title, text, icon = 'success') => {
    return Swal.fire({
      title: title,
      text: text,
      icon: icon,
      confirmButtonText: 'OK',
    })
  }

  const showConfirm = (title, text, icon = 'warning', confirmButtonText = 'Ya, Hapus!') => {
    return Swal.fire({
      title: title,
      text: text,
      icon: icon,
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: confirmButtonText,
      cancelButtonText: 'Batal',
    })
  }

  const showToast = (title, icon = 'success', text = '') => {
    return Swal.fire({
      toast: true,
      position: 'top-end',
      icon,
      title,
      text,
      showConfirmButton: false,
      timer: 3200,
      timerProgressBar: true,
    })
  }

  const showToastConfirm = (title, text = '', confirmButtonText = 'Install') => {
    return Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'question',
      title,
      text,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText: 'Nanti',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      timer: undefined,
    })
  }

  return {
    showAlert,
    showConfirm,
    showToast,
    showToastConfirm,
  }
}
