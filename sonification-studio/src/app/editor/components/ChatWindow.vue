<template>
    <div class="chat-container">
        <div
            class="chat-section"
            :class="{ 'minimized': isMinimized }"
        >
            <div class="chat-header">
                <h3>Chatbot</h3>
                <button @click="toggleVisibility">
                    {{ isMinimized ? 'Expand' : 'Minimize' }}
                </button>
            </div>
            <div
                v-if="!isMinimized"
                class="messages"
            >
                <div
                    v-for="message in messages"
                    :key="message.id"
                    :class="['message', { 'message-sender': message.sender === 'User', 'message-emitter': message.sender === 'Bot' }]"
                >
                    <strong>{{ message.sender }}:</strong> {{ message.text }}
                </div>
            </div>
            <div
                v-if="!isMinimized"
                class="input-group"
            >
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
import { mapState } from 'vuex';

export default {
    data() {
        return {
            newMessage: '',
            messages: [],
            isMinimized: false,
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
        toggleVisibility() {
            this.isMinimized = !this.isMinimized;
        },
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
                const response = await axios.post('http://127.0.0.1:5000/llm/promtUser', {
                    userPrompt: this.newMessage,
                    speed: this.speed,
                    detail: this.detail,
                    playMarkerEnabled: this.playMarkerEnabled,
                    tooltipMarkerEnabled: this.tooltipMarkerEnabled,
                    order: this.order
                });

                const botResponse = this.createMessage('Bot', response.data.message);
                this.messages.push(botResponse);

                if (response.data.suggestions) {
                    const newConfig = {
                        speed: response.data.suggestions.speed,
                        detail: response.data.suggestions.detail,
                        playMarkerEnabled: response.data.suggestions.play_marker_enabled,
                        tooltipMarkerEnabled: response.data.suggestions.tooltip_marker_enabled
                    };

                    this.$store.commit('globalSonifyParametersStore/updateParameters', newConfig);
                }
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
@import '../sidebar.less';
@import "../colors.less";

.chat-container {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
}

.chat-section {
    display: flex;
    flex-direction: column;
    margin-top: 20px;
    border: 1px solid @seinput-border-color;
    border-radius: 5px;
    padding: 10px;
    background-color: @app-bg-color;
}

.chat-section.minimized {
    height: 40px; /* Altura mínima cuando está minimizado */
    padding: 10px;
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
    color: @dark-blue-5; /* Usando el color definido */
}

.message-emitter {
    color: @green-5; /* Usando el color verde */
}

.input-group {
    display: flex;
}

.chat-input {
    flex-grow: 1;
    padding: 5px;
    border: 1px solid @se-inputbox-border-color;
    border-radius: 5px;
    background-color: @se-inputbox-bg; /* Fondo de la caja de entrada */
    color: @se-inputbox-color; /* Color del texto */
}

.send-button {
    margin-left: 5px;
    padding: 5px 10px;
    border: none;
    border-radius: 5px;
    background-color: @sebutton-bg;
    color: @sebutton-color;
    cursor: pointer;

    &:hover {
        background-color: @sebutton-hover-bg;
        color: @sebutton-hover-color;
    }
}
</style>