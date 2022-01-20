import { api } from 'boot/axios';

const findWorkorderByID = () => async (payload) => {
  const list = []
  String(payload).split(/[ \-,;\t\n]/g)
    .map(i => {
      let hexid = i.trim()
      if (hexid.startsWith('i')) {
        hexid = parseInt(hexid.substring(1)).toString(16)
      }
      return hexid.toUpperCase()
    })
    .filter(hexid => !!hexid)
    .forEach(hexid => list.push(hexid))
  const { data } = await api.post('/workorders', list)
  return data
}

const findWorkorderByCustomer = () => async (payload) => {
  const { data } = await api.get(`/workorders/${payload}`)
  return data
}

export { findWorkorderByID, findWorkorderByCustomer };
