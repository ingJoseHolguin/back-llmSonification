from app import create_app

# This app refer to the flask app
# ⇩
app = create_app()  # CREATE THE FLASK APP

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
