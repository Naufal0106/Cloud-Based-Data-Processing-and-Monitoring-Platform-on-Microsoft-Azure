import azure.functions as func
app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)

@app.route(route="hello")
def hello(req: func.HttpRequest) -> func.HttpResponse:
    return func.HttpResponse("Azure K11 Nyala!", status_code=200)