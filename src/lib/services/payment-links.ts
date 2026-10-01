/**
 * Links Oficiais de Checkout e CobranÃ§a da InfinitePay para o Vurio
 * Conta: Solucione Assessoria Virtual ($solucione-0s1)
 */
export const INFINITEPAY_LINKS = {
  // Consultas Avulsas (CartÃ£o de CrÃ©dito e Pix apÃ³s ativaÃ§Ã£o no App)
  CONSULTA_AVULSA_10: 'https://link.infinitepay.io/solucione-0s1/Ri0x-ofGuGKW2dD-10,00',
  CONSULTA_AVULSA_GEO_13: 'https://link.infinitepay.io/solucione-0s1/Ri0x-Fg28KsHJTM-13,00',
  
  // Add-ons Periciais JurÃ­dicos
  DOSSIE_POLICIAL_89: 'https://link.infinitepay.io/solucione-0s1/Ri0x-GkKs5Wgo6f-89,00',
  DILIGENCIA_CFM_15: 'https://link.infinitepay.io/solucione-0s1/Ri0x-ODqeuT487v-15,00',

  // Checkouts Diretos Self-Service dos Planos (100% AutomÃ¡tico - Pix e CartÃ£o)
  CHECKOUT_STARTER_149: 'https://checkout.infinitepay.io/solucione-0s1?lenc=G_4AAGRsbfvUxBGRRmSE8iISCmOdEv4xD-ky6_f0UMMAUy4rCNqidrDT8SYHPeiPP9QNl0FK98-mDHL3jo3PHnkvTiGZpZHpVzVYtQBQo2qzM0T9wWDQ6jWa1ekV9r9use-ksul7arURN3P8tt8emxRIjrr-R50L1QQra0f0fPRRk7fNCmWXCTih7cYa5iOCA_ipcd0F55grvPUXrRjU_TS5Rqo3fBo5sD1OooKPM45SVFfE2DBA57LoFA.v1.6fcaeef9240f94ad',
  CHECKOUT_PRO_399: 'https://checkout.infinitepay.io/solucione-0s1?lenc=G_sAYIzTZfYzapJG58yUq90BQKkhtCzM8_jr6-3EQlU_ngoFypYHFKj0VhB0FwYWdZfxQCe6TXDgJivNWQ642YjlfVBt9UtLKf8AwUkAyyg20jIisNzs98v1bq_Xa3Rq9Wat0ct9v50ojLkVwNQp12g9487VYpuOKxnj-l7_DzjzUx8bKeypP8aBkVoOSCAwZ3L3RZDCw5Ab-XJoNZF7qubO2o0V9hTk7Eg0bzRO4k_1mKCBqxm7Saq2QX35MhVFYw.v1.50123551c4ddd997',

  // Slugs Oficiais dos Planos de RecorrÃªncia na InfinitePay
  PLANOS_SLUGS: {
    STARTER: 'a9uywH9Nrp',      // R$ 149,00/mÃªs
    PRO: 'dmAxCSaySf',          // R$ 399,00/mÃªs
    GEO_SHIELD_ADDON: 'CoQoJ6Bb5Z' // R$ 49,00/mÃªs
  },

  // Numero oficial do WhatsApp do Vurio: (13) 3150-0987 - Solucione Assessoria Virtual
  WHATSAPP_NUMBER: process.env.WHATSAPP_BOT_PHONE || '551331500987',

  // Links diretos para AtivaÃ§Ã£o de Planos Recorrentes via WhatsApp
  PLANOS_WHATSAPP: {
    STARTER: `https://wa.me/${process.env.WHATSAPP_BOT_PHONE || '551331500987'}?text=Ol%C3%A1!%20Quero%20assinar%20o%20Plano%20Starter%20RH%20(R$%20149/m%C3%AAs)%20do%20Vurio`,
    PRO: `https://wa.me/${process.env.WHATSAPP_BOT_PHONE || '551331500987'}?text=Ol%C3%A1!%20Quero%20assinar%20o%20Plano%20Compliance%20Pro%20(R$%20399/m%C3%AAs)%20do%20Vurio`,
    ENTERPRISE: `https://wa.me/${process.env.WHATSAPP_BOT_PHONE || '551331500987'}?text=Ol%C3%A1!%20Gostaria%20de%20uma%20proposta%20do%20Plano%20Enterprise%20do%20Vurio`
  }
};


