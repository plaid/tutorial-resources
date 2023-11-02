//
//  ServerCommunicator.swift
//  SamplePlaidClient
//
//  Created by Todd Kerpelman on 8/18/23.
//

import Foundation

///
/// Just a helper class that simplifies some of the work involved in calling our server
///
class ServerCommunicator {

    enum HTTPMethod: String {
        case get = "GET"
        case post = "POST"
    }

    enum Error: LocalizedError {
        case invalidUrl(String)
        case networkError(String)
        case encodingError(String)
        case decodingError(String)
        case nilData

        var localizedDescription: String {
            switch self {
            case .invalidUrl(let url): return "Invalid URL: \(url)"
            case .networkError(let error): return "Network Error: \(error)"
            case .encodingError(let error): return "Encoding Error: \(error)"
            case .decodingError(let error): return "Decoding Error: \(error)"
            case .nilData: return "Server return null data"
            }
        }

        var errorDescription: String? {
            return localizedDescription
        }
    }


    init(baseURL: String = "http://localhost:8000/") {
        self.baseURL = baseURL
    }

    func callMyServer<T: Decodable>(
        path: String,
        httpMethod: HTTPMethod,
        params: [String: Any]? = nil,
        completion: @escaping (Result<T, ServerCommunicator.Error>) -> Void) {

            let path = path.hasPrefix("/") ? String(path.dropFirst()) : path
            let urlString = baseURL + path

            guard let url = URL(string: urlString) else {
                completion(.failure(ServerCommunicator.Error.invalidUrl(urlString)))
                return
            }

            var request = URLRequest(url: url)
            request.httpMethod = httpMethod.rawValue
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.setValue("application/json", forHTTPHeaderField: "Accept")

            switch httpMethod {
            case .post where params != nil:
                do {
                    let jsonData = try JSONSerialization.data(withJSONObject: params!, options: [])
                    request.httpBody = jsonData
                } catch {
                    completion(.failure(.encodingError("\(error)")))
                    return
                }
            default:
                break
            }

            // Create the task
            let task = URLSession.shared.dataTask(with: request) { (data, _, error) in

                DispatchQueue.main.async {

                    if let error = error {
                        completion(.failure(.networkError("\(error)")))
                        return
                    }

                    guard let data = data else {
                        completion(.failure(.nilData))
                        return
                    }
                    print("Received data from: \(path)")
                    data.printJson()

                    do {
                        let object = try JSONDecoder().decode(T.self, from: data)
                        completion(.success(object))

                    } catch {
                        completion(.failure(.decodingError("\(error)")))
                    }
                }
            }

            task.resume()
    }
    
    struct DummyDecodable: Decodable { }

    // Convenience method where we don't want to do anything yet with the result, beyond seeing what we get back from the server
    func callMyServer(
        path: String,
        httpMethod: HTTPMethod,
        params: [String: Any]? = nil
    ) {
        callMyServer(path: path, httpMethod: httpMethod, params: params) { (_: Result<DummyDecodable, ServerCommunicator.Error>) in
            // Do nothing here
        }
    }


    private let baseURL: String
}

extension Data {

    fileprivate func printJson() {
        do {
            let json = try JSONSerialization.jsonObject(with: self, options: [])
            let data = try JSONSerialization.data(withJSONObject: json, options: .prettyPrinted)
            guard let jsonString = String(data: data, encoding: .utf8) else {
                print("Invalid data")
                return
            }
            print(jsonString)
        } catch {
            print("Error: \(error.localizedDescription)")
        }
    }
}
