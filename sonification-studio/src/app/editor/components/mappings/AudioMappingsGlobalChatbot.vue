<template>
    <div class="chat-container">
        <div class="chat-section">
            <div class="messages">
                <div
                    v-for="message in messages"
                    :key="message.id"
                    :class="['message', { 'message-sender': message.sender === 'User', 'message-emitter': message.sender === 'Bot' }]"
                >
                    <strong>{{ message.sender }}:</strong> {{ message.text }}
                </div>
            </div>
            <div class="input-group">
                <input
                    v-model="newMessage"
                    type="text"
                    placeholder="Type your message..."
                    class="chat-input"
                    @keyup.enter="sendMessage"
                >
                <button
                    class="send-button"
                    @click="sendMessage"
                >
                    Send
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import axios from 'axios';
import { string } from 'mathjs';
import { mapState } from 'vuex';

export default {
    data() {
        return {
            newMessage: '',
            messages: [],
            isModelLoaded: false
        };
    },
    computed: {
        ...mapState({
            speed: state => state.globalSonifyParametersStore.speed,
            detail: state => state.globalSonifyParametersStore.detail,
            playMarkerEnabled: state => state.globalSonifyParametersStore.playMarkerEnabled,
            tooltipMarkerEnabled: state => state.globalSonifyParametersStore.tooltipMarkerEnabled,
            order: state => state.globalSonifyParametersStore.order
        })
    },
    methods: {
        createMessage(sender, text) {
            return { id: Date.now(), sender, text };
        },
        async sendMessage() {
            if (this.newMessage.trim() === '') return;

            const globalAudioDataSettings = {
                speed: this.speed,
                detail: this.detail,
                playMarkerEnabled: this.playMarkerEnabled,
                tooltipMarkerEnabled: this.tooltipMarkerEnabled,
                order: this.order
            };


            if (!this.isModelLoaded) {
                try {
                    const testServer = await axios.get('http://127.0.0.1:5000/llm/', { timeout: 10000 });

                    if (testServer.data.message === 'llM en linea') {
                        this.messages.push(this.createMessage('Bot', 'LLM connected'));
                    }

                    const loadLLM = await axios.get('http://127.0.0.1:5000/llm/loadModel', { timeout: 10000 });
                    const loadDocuments = await axios.get('http://127.0.0.1:5000/llm/loadDocuments', { timeout: 10000 });

                    if (loadDocuments.data.message === 'OK' && loadLLM.data.message === 'OK') {
                        this.isModelLoaded = true;
                    } else {
                        this.messages.push(this.createMessage('Bot', 'Error: Could not load LLM or documents.'));
                    }

                } catch (error) {
                    console.error('Error al cargar el modelo:', error.response ? error.response.data : error);
                    this.messages.push(this.createMessage('Bot', 'Error: No se pudo cargar el modelo.'));
                    return;
                }
            }

            const userMessage = this.createMessage('User', this.newMessage);
            this.messages.push(userMessage);

            try {

                const SPEED = this.speed;
                const response = await axios.post('http://127.0.0.1:5000/llm/promtUser', {
                    userPrompt: this.newMessage,
                    speed: this.speed,
                    detail: this.detail,
                    playMarkerEnabled: this.playMarkerEnabled,
                    tooltipMarkerEnabled: this.tooltipMarkerEnabled,
                    order: this.order
                });



                console.log(response);
                console.log(globalAudioDataSettings);



                const botResponse = this.createMessage('Bot', response.data.message);
                this.messages.push(botResponse);
            } catch (error) {
                console.error('Error al enviar el mensaje:', error);
                this.messages.push(this.createMessage('Bot', 'Error: Service LLM.'));
            }

            this.newMessage = '';
        },
    },
};
</script>

<style lang="less" scoped>
@import "../../sidebar";

.chat-container {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
}

.chat-section {
    display: flex;
    flex-direction: column;
    margin-top: 20px;
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 10px;
    background-color: #f9f9f9;
}

.messages {
    flex-grow: 1;
    overflow-y: auto;
    max-height: 200px;
    margin-bottom: 10px;
}

.message {
    margin-bottom: 5px;
}

.message-sender {
    color: blue;
}

.message-emitter {
    color: green;
}

.input-group {
    display: flex;
}

.chat-input {
    flex-grow: 1;
    padding: 5px;
    border: 1px solid #ccc;
    border-radius: 5px;
}

.send-button {
    margin-left: 5px;
    padding: 5px 10px;
    border: none;
    border-radius: 5px;
    background-color: #007bff;
    color: white;
    cursor: pointer;
}
</style>