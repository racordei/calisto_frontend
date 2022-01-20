<template>
  <q-page :padding="false">
    <CTable
      title="Production Status"
      flat
      :rows="rows"
      :columns="columns"
      row-key="name"
      :loading="loading"
    >
      <template v-slot:top-right-before>
        <q-input
          filled
          dense
          debounce="300"
          :placeholder="$t('workorder-table-search')"
          v-model="searchWorkorderIDFilter"
          @keydown.escape.prevent="searchWorkorderIDFilter = null"
          @keydown.enter.prevent="searchWorkorder"
          class="q-pr-sm">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-select
          filled
          dense
          v-model="selectedCustomer"
          :options="customers"
          label="Customer"
          class="q-pr-sm"
          style="min-width: 213px"
          @update:model-value="searchWorkorderByCustomer" />
      </template>

      <template v-slot:body-cell-productname="{ props }">
        <q-td :key="props.col.name" auto-width >
          <q-icon v-if="props.row.productstatus === 'A'" name="toggle_on" size="32px" color="positive" class="q-pr-sm" />
          <q-icon v-else name="toggle_off" size="32px" color="negative" class="q-pr-sm" />
          {{ props.col.value }}
        </q-td>
      </template>
    </CTable>
  </q-page>
</template>

<script>
import { mapGetters } from 'vuex'
import { defineComponent, ref } from 'vue'
import CTable from 'components/CTable.vue'

const columnsDef = [
  { name: 'hexid', align: 'left', label: 'ID', field: 'hexid', sortable: true, required: true },
  {
    name: 'customername',
    label: 'Customer',
    align: 'left',
    field: row => row.customername,
    format: val => `${val}`,
    sortable: true
  },
  { name: 'inputfilename', align: 'left', label: 'Input File Name', field: 'inputfilename', sortable: true, hidden: true },
  { name: 'batchname', align: 'left', label: 'Batchname', field: 'batchname', sortable: true, hidden: true },
  { name: 'productname', align: 'left', label: 'Product Name', field: 'productname' },
  { name: 'productalias', align: 'left', label: 'Product Alias', field: 'productalias', hidden: true },
  {
    name: 'productstatus',
    label: 'ProdStatus',
    field: 'productstatus',
    sortable: true,
    hidden: true
  },
  {
    name: 'creationdate',
    label: 'Creation Date',
    field: 'creationdate',
    sortable: true,
    // sort: (a, b) => parseInt(a, 10) - parseInt(b, 10),
    // format: val => date.formatDate(val, 'YYYY-MM-DD HH:mm:ss')
  },
  {
    name: 'duedate',
    label: 'Due Date',
    field: 'duedate',
    sortable: true,
    dateOnly: true
  },
  {
    name: 'shippingdate',
    label: 'Shipping Date',
    field: 'shippingdate',
    sortable: true,
    // sort: (a, b) => parseInt(a, 10) - parseInt(b, 10),
    // format: val => date.formatDate(val, 'YYYY-MM-DD HH:mm:ss')
  },
]

export default defineComponent({
  name: 'PageIndex',

  components: {
    CTable
  },

  setup() {
    return {
      rows: ref([]),
      columns: ref(columnsDef),
      loading: ref(false),
      searchWorkorderIDFilter: ref(''),
      customers: ref([]),
      selectedCustomer: ref('')
    }
  },

  computed: {
    ...mapGetters('workorder', ['findWorkorderByID', 'findWorkorderByCustomer']),
  },

  methods: {
    ...mapGetters('customer', ['findCustomer']),
    searchWorkorder() {
      this.findWorkorderByID(this.searchWorkorderIDFilter)
        .then(result => {
          this.rows = result
        })
      this.searchWorkorderIDFilter = null
    },
    searchWorkorderByCustomer(customer) {
      if (customer) {
        this.loading = true
        this.findWorkorderByCustomer(customer).then(result => {
          this.rows = result
          this.loading = false
        })
      }
    }
  },

  created() {
    this.loading = true
    Promise.all([
      this.findCustomer().then(result => this.customers = result),
      this.findWorkorderByID('4E7A09 4E7A0E 4E7C87 4E7C96 4FB696 4FB6AE').then(result => {
        this.rows = result
      })]).then(() => this.loading = false)
  }
})
</script>

<style lang="scss">
</style>