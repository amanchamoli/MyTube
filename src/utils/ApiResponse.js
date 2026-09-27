class ApiResponse {
    constructor(statusCode, data, message = "Success"){
        this.starusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
    }
}

export { ApiResponse }