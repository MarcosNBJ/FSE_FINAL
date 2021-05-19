# FSE - Projeto Final

O projeto visa construir um recurso de automação residencial. Uma ESP32 faz o papel de dispositivo de automação, com
seu led representando um dispositivo, como uma lâmpada por exemplo, e o botão representando um sensor de presença ou algo parecido.
Com isso, existe um servidor central que se comunica com a ESP através do protocolo MQTT. Na interface desse servidor central é possivel interagir com os dispositivos cadastrados e acompanhar a temperatura e a humidade sendo medida pela esp, em conjunto com o estado atual do botão.
Por fim, existe também uma funcionalidade atual de alarme, que quando armado dispara um som caso o sensor de presença seja ativado.

### Aluno: Marcos Nery Borges Júnior - 170017885

## Execução

- **Linguagem:** C na ESP e JavaScript no Central
- **Instruções de execução:**

1. Clonar o repositório
2. Iniciar o servidor central, cujas instruções estão listadas mais abaixo
3. Com o servidor central iniciado, iniciar a ESP com o código na pasta "esp"
4. Em poucos segundos aparecerá no frontend a solicitação de cadastro da ESP e os menus de interação

## Instruções para iniciar o servidor central

Se você tiver o `yarn` instalado basta ir até a pasta `central`,
executar um `yarn install` e em seguida um `yarn dev`. Com isso você poderá acessar seu localhost
na porta 3000 e ver tudo funcionado.

Caso você não tenha o yarn mas tenha `docker` tudo bem também. Basta ir até a pasta `central` e
executar um `docker-compose up`. Após isso a aplicação estará acessível na porta 3000 do seu localhost

## Video demonstrativo

Abaxo segue um vídeo demonstrando o funcionamento do programa.
https://youtu.be/1Sdm1R5LbRs
