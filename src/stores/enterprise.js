import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useEnterpriseStore = defineStore('enterprise', () => {
  const personnelList = ref([
    { personId: 'P001', name: '王开发', department: '公司', accountId: 101, allocated: 50000, used: 32000, remaining: 18000, expired: 0, video: 12, image: 8, text: 45, audio: 3, avatar: 2 },
    { personId: 'P002', name: '赵老板', department: '公司', accountId: 102, allocated: 100000, used: 80000, remaining: 15000, expired: 5000, video: 28, image: 15, text: 60, audio: 8, avatar: 5 },
    { personId: 'P003', name: '杜总', department: '漫剧部', accountId: 103, allocated: 80000, used: 55000, remaining: 22000, expired: 3000, video: 35, image: 20, text: 80, audio: 6, avatar: 4 },
    { personId: 'P004', name: '刘总', department: '漫剧部', accountId: 104, allocated: 75000, used: 60000, remaining: 12000, expired: 3000, video: 22, image: 18, text: 55, audio: 10, avatar: 6 },
    { personId: 'P005', name: '张经理', department: '电商部', accountId: 105, allocated: 60000, used: 42000, remaining: 16000, expired: 2000, video: 18, image: 30, text: 40, audio: 4, avatar: 3 },
    { personId: 'P006', name: '马经理', department: '电商部', accountId: 106, allocated: 55000, used: 38000, remaining: 15000, expired: 2000, video: 15, image: 25, text: 35, audio: 3, avatar: 2 },
    { personId: 'P007', name: '小关', department: '漫剧1组', accountId: 107, allocated: 40000, used: 35000, remaining: 3000, expired: 2000, video: 20, image: 12, text: 50, audio: 5, avatar: 3 },
    { personId: 'P008', name: '小李', department: '漫剧1组', accountId: 108, allocated: 35000, used: 28000, remaining: 5000, expired: 2000, video: 16, image: 10, text: 42, audio: 4, avatar: 2 }
  ])

  const accountList = ref([
    { id: 101, name: '超级管理员账号', department: '公司', personName: '王开发', allocated: 50000, _adjust: 0, _changed: false },
    { id: 102, name: '公司账号', department: '公司', personName: '赵老板', allocated: 100000, _adjust: 0, _changed: false },
    { id: 103, name: '漫剧部主账号', department: '漫剧部', personName: '杜总', allocated: 80000, _adjust: 0, _changed: false },
    { id: 104, name: '漫剧部副账号', department: '漫剧部', personName: '刘总', allocated: 75000, _adjust: 0, _changed: false },
    { id: 105, name: '电商部主账号', department: '电商部', personName: '张经理', allocated: 60000, _adjust: 0, _changed: false },
    { id: 106, name: '电商部副账号', department: '电商部', personName: '马经理', allocated: 55000, _adjust: 0, _changed: false },
    { id: 107, name: '漫剧1组主账号', department: '漫剧1组', personName: '小关', allocated: 40000, _adjust: 0, _changed: false },
    { id: 108, name: '漫剧1组副账号', department: '漫剧1组', personName: '小李', allocated: 35000, _adjust: 0, _changed: false },
    { id: 109, name: '漫剧2组主账号', department: '漫剧2组', personName: '小谢', allocated: 38000, _adjust: 0, _changed: false },
    { id: 110, name: '漫剧2组副账号', department: '漫剧2组', personName: '-', allocated: 30000, _adjust: 0, _changed: false },
    { id: 111, name: '电商1组账号', department: '电商1组', personName: '小胡', allocated: 25000, _adjust: 0, _changed: false }
  ])

  const nextPersonId = computed(() => {
    return 'P' + String(personnelList.value.length + 1).padStart(3, '0')
  })

  function syncAccountToPersonnel(account) {
    const exists = personnelList.value.find(p => p.accountId === account.id)
    if (exists) {
      exists.name = account.personName
      exists.department = account.department
      exists.allocated = account.allocated
      return { action: 'updated', person: exists }
    }
    const newPerson = {
      personId: nextPersonId.value,
      name: account.personName || `账号${account.id}`,
      department: account.department,
      accountId: account.id,
      allocated: account.allocated || 0,
      used: 0,
      remaining: account.allocated || 0,
      expired: 0,
      video: 0,
      image: 0,
      text: 0,
      audio: 0,
      avatar: 0
    }
    personnelList.value.push(newPerson)
    return { action: 'created', person: newPerson }
  }

  function addAccountToQuotaList(account) {
    const exists = accountList.value.find(a => a.id === account.id)
    if (exists) {
      exists.name = account.nature === '超级管理员' ? '超级管理员账号' : `${account.department}账号`
      exists.personName = account.personName || '-'
      exists.department = account.department
      exists.allocated = account.allocated || 0
      return { action: 'updated', quotaAccount: exists }
    }

    const newQuotaAccount = {
      id: account.id,
      name: account.nature === '超级管理员' ? '超级管理员账号' : `${account.department}账号`,
      department: account.department,
      personName: account.personName || '-',
      allocated: account.allocated || 0,
      _adjust: 0,
      _changed: false
    }
    accountList.value.push(newQuotaAccount)
    return { action: 'created', quotaAccount: newQuotaAccount }
  }

  function getPersonnelByAccount(accountId) {
    return personnelList.value.find(p => p.accountId === accountId) || null
  }

  function removePersonnelByAccount(accountId) {
    const idx = personnelList.value.findIndex(p => p.accountId === accountId)
    if (idx !== -1) {
      personnelList.value.splice(idx, 1)
      return true
    }
    return false
  }

  return {
    personnelList,
    accountList,
    syncAccountToPersonnel,
    addAccountToQuotaList,
    getPersonnelByAccount,
    removePersonnelByAccount
  }
})
