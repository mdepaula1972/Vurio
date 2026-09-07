# TERMOS DE USO E POLÍTICA DE PRIVACIDADE E SEGURANÇA DA INFORMAÇÃO (LGPD)
### VURIO COMPLIANCE & PERÍCIA DIGITAL LTDA

**Data da Última Atualização:** 07 de Setembro de 2026  
**Vigência:** Imediata para todas as consultas avulsas, assinaturas de planos e integrações de API.

---

## 1. NATUREZA JURÍDICA E ESCOPO DOS SERVIÇOS

1.1. O **VURIO** é uma plataforma tecnológica de conformidade, perícia forense e auditoria documental em tempo real, desenvolvida para auxiliar empregadores, departamentos de Recursos Humanos (DP/RH), microempreendedores e profissionais de saúde na conferência técnica de autenticidade, integridade criptográfica e validade cadastral de atestados médicos.

1.2. O **VURIO atua estritamente como auditor técnico consultivo independente**, emitindo pareceres algorítmicos com base nos padrões públicos da Infraestrutura de Chaves Públicas Brasileira (**ICP-Brasil - MP nº 2.200-2/2001**), nos registros públicos do **Conselho Federal de Medicina (CFM / CRMs)**, na **Lei Federal nº 14.510/2023** (Telemedicina), na **Consolidação das Leis do Trabalho (CLT - Decreto-Lei nº 5.452/1943)** e nas diretrizes da **Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018)**.

1.3. O VURIO **NÃO atua como autoridade policial, órgão judicante ou acusador**. Seus relatórios consistem em apontamentos de conformidade e divergências materiais que visam municiar o empregador para averiguações administrativas prudentes e respaldar decisões internas de folha de pagamento.

---

## 2. ARQUITETURA DE EFEMERIDADE E ZERO RETENÇÃO DE ARQUIVOS (ZERO-DATA RETENTION)

> ### ⚠️ CLÁUSULA FUNDAMENTAL DE NÃO CUSTÓDIA DE DOCUMENTOS
>
> 2.1. **Processamento Efêmero em Memória:** O VURIO adota a política de estrita necessidade e minimização de dados (**Art. 6º, III da LGPD**). Todos os arquivos de atestados médicos enviados para auditoria (sejam arquivos digitais em formato PDF ou fotografias de receituários físicos) são processados **exclusivamente em memória volátil temporária** pelo tempo estritamente necessário para a extração criptográfica e análise cadastral.
>
> 2.2. **Expurgo Imediato:** Uma vez finalizada a perícia e transmitido o Laudo Pericial de Auditoria ao USUÁRIO/CONTRATANTE (seja via WhatsApp, API ou download no painel Web), **o arquivo original (PDF ou imagem) é sumariamente DESTRUÍDO e PURGADO de nossos servidores e memórias temporárias**.
>
> 2.3. **Ausência de Banco de Documentos / Não Custódia:** O VURIO **NÃO mantém cópia, espelho, backup ou custódia contínua dos arquivos de atestados médicos em bancos de dados**. A entrega do Laudo Pericial ao CONTRATANTE substitui e exaure integralmente qualquer necessidade ou obrigação do VURIO de conservar arquivos brutos.
>
> 2.4. **Exoneração de Responsabilidade por Perda:** Compete exclusiva e indelevelmente ao CONTRATANTE providenciar a guarda física e digital, o arquivamento e a gestão probatória dos atestados médicos de seus colaboradores em seus próprios repositórios internos, nos termos da legislação trabalhista e fiscal. O VURIO resta expressamente isento de qualquer responsabilidade decorrente da perda, exclusão ou extravio de arquivos que ocorram no âmbito dos sistemas internos do CONTRATANTE.

---

## 3. QUAIS DADOS SÃO REGISTRADOS (LOGS DE AUDITORIA CRIPTOGRÁFICA)

3.1. Para fins de garantia da segurança jurídica do próprio CONTRATANTE, prevenção a fraudes e controle de duplicidade de envios (**Art. 7º, IX e Art. 11, II, "a" e "g" da LGPD**), o VURIO armazena unicamente metadados técnicos de auditoria, a saber:
* **Hash Criptográfico SHA-256:** Impressão digital matemática irreversível gerada a partir do arquivo original, utilizada como trava antifraude para impedir que o mesmo documento seja reutilizado para abonos indevidos;
* **Registro Profissional do Médico:** Nome oficial constante no CFM, número de CRM e Estado (UF) emissor;
* **Metadados Temporais do Parecer:** Data e hora exata da validação, tempo de execução e status técnico da assinatura ICP-Brasil;
* **Período de Afastamento Concedido:** Quantidade de dias prescritos e data de início do repouso, necessários para a parametrização de prazos da CCT e limites de 15 dias para o INSS.

3.2. **Proteção Rigorosa de Dados Sensíveis de Saúde:**
* O VURIO **NÃO armazena diagnósticos médicos ou códigos da CID (Classificação Internacional de Doenças) em banco de dados relacional permanente**. Caso o CID conste no documento, ele é processado de forma efêmera e devolvido no laudo ao DP, preservando a intimidade e a privacidade médica do paciente (**Art. 5º, II da LGPD e Resolução CFM nº 1.658/2002**).
* Números de CPF de pacientes com proteção por máscara LGPD (ex: `***.456.789-**`) são respeitados e protegidos por sigilo cadastral.

---

## 4. PAPÉIS SOB A LGPD (CONTROLADOR VS. OPERADOR)

4.1. **O CONTRATANTE (Empregador / Empresa / Usuário):** Qualifica-se como **CONTROLADOR** dos dados pessoais de seus colaboradores e dependentes, sendo o único responsável por possuir base legal válida (execução de contrato de trabalho, cumprimento de obrigação legal da CLT/eSocial e exercício regular de direitos).

4.2. **O VURIO COMPLIANCE:** Qualifica-se como **OPERADOR**, realizando o tratamento técnico e pericial dos dados estritamente sob as instruções do CONTRATANTE e nos limites operacionais do serviço contratado.

---

## 5. MODALIDADES DE SERVIÇOS E POLÍTICA DE COBRANÇA

5.1. **Consulta Avulsa (Sem Mensalidade):**
* Destinada a microempreendedores (MEI), empregadores domésticos e microempresas;
* Cobrança sob demanda de **R$ 10,00 por documento auditado** (ou R$ 13,00 na opção com auditoria de deslocamento Geo-Shield), liquidada via PIX ou Cartão através do link seguro oficial da InfinitePay;
* A emissão do laudo pericial no WhatsApp conclui e aperfeiçoa a prestação do serviço contratado.

5.2. **Planos Corporativos Mensais (Starter RH e Compliance Pro):**
* Cobrança recorrente mensal via InfinitePay para créditos mensais de auditoria, acesso ao Painel do Cliente (`/dashboard`) e esteira de diligências;
* Franquias mensais não consumidas expiram conforme as regras de rollover estipuladas no plano vigente.

5.3. **Produtos Adicionais (Add-ons Independentes):**
* **Geo-Shield:** Módulo de auditoria de compatibilidade de rota e deslocamento geográfico entre o posto de trabalho e a clínica médica (R$ 49/mês ou R$ 3 avulso);
* **Dossiê Notícia-Crime para B.O.:** Emissão de certidão pericial forense com carimbo de tempo ICP-Brasil para protocolo policial (R$ 89 avulso ou R$ 49 para assinantes);
* **Diligência Formal CFM:** Emissão de ofício administrativo formal 1-clique (R$ 15 por ofício).

---

## 6. SEGURANÇA DA INFORMAÇÃO E ISENÇÃO DE RESPONSABILIDADE

6.1. O VURIO emprega padrões de criptografia de ponta a ponta (TLS 1.3), túneis seguros e infraestrutura em nuvem com certificação SOC 2 / ISO 27001.

6.2. O VURIO não garante a higidez clínica ou a veracidade do diagnóstico emitido pelo médico assistente, limitando-se à aferição da autenticidade da assinatura digital, à situação cadastral do profissional perante os Conselhos Regionais de Medicina (CRMs) e à coerência formal do documento.

6.3. As decisões disciplinares, demissões com ou sem justa causa, concessão ou glosa de abonos na folha de pagamento são de **competência e responsabilidade privativa do CONTRATANTE**, cabendo a este proceder com o devido processo administrativo interno.

---

## 7. FORO E LEGISLAÇÃO APLICÁVEL

7.1. Estes Termos e a Política de Privacidade são regidos pelas leis da República Federativa do Brasil.

7.2. Fica eleito o Foro da Comarca da sede da CONTRATADA para dirimir quaisquer litígios oriundos do presente instrumento, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
