class ApiResponse {
    constructor(statusCode, data, message = "Success"){
        this.starusCode = statusCode
        this.data = data
        this.message = message
        this.sucess = statusCode < 400
    }
}