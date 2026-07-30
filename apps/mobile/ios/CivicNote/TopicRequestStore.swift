import Combine
import Foundation

/// Reader-submitted subjects. A request is filed against the anonymous
/// installation ID — the same identifier the app already uses for alerts — so
/// the list below is this device's own, with no account behind it.
@MainActor
final class TopicRequestStore: ObservableObject {
    @Published private(set) var requests: [TopicRequest] = []
    @Published private(set) var isLoading = false
    @Published private(set) var isSubmitting = false
    @Published private(set) var errorMessage: String?
    @Published private(set) var confirmation: String?

    /// The shortest subject the server will accept. Checked here too so the
    /// submit button can stay disabled instead of failing after a round trip.
    static let minimumSubjectLength = 8
    static let maximumSubjectLength = 200

    let isAvailable: Bool

    private let installationID: String
    private let baseURL: URL
    private let session: URLSession

    init(
        installationID: String,
        baseURL: URL,
        session: URLSession = .shared,
        networkEnabled: Bool = true
    ) {
        self.installationID = installationID
        self.baseURL = baseURL
        self.session = session
        isAvailable = networkEnabled
    }

    func load() async {
        guard isAvailable, !isLoading else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            var components = URLComponents(
                url: url(for: ["api", "v1", "topic-requests"]),
                resolvingAgainstBaseURL: false
            )
            components?.queryItems = [URLQueryItem(name: "installationId", value: installationID)]
            guard let requestURL = components?.url else { throw CivicRepositoryError.invalidBaseURL }
            var request = URLRequest(url: requestURL)
            request.timeoutInterval = 20
            request.setValue("application/json", forHTTPHeaderField: "Accept")
            let response: TopicRequestsResponseDTO = try await send(request)
            requests = response.requests.map { $0.domain() }
            errorMessage = nil
        } catch {
            errorMessage = message(for: error)
        }
    }

    /// Returns true when the request was filed, so the form can clear itself.
    @discardableResult
    func submit(subject: String, reason: String, regionHint: String) async -> Bool {
        guard isAvailable, !isSubmitting else { return false }
        let trimmedSubject = subject.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmedSubject.count >= Self.minimumSubjectLength else {
            errorMessage = "Describe the subject in a few more words."
            return false
        }

        isSubmitting = true
        defer { isSubmitting = false }
        do {
            var request = URLRequest(url: url(for: ["api", "v1", "topic-requests"]))
            request.httpMethod = "POST"
            request.timeoutInterval = 20
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try CivicJSON.encoder().encode(
                TopicRequestSubmission(
                    installationId: installationID,
                    subject: String(trimmedSubject.prefix(Self.maximumSubjectLength)),
                    reason: reason.trimmed.nilIfEmpty,
                    regionHint: regionHint.trimmed.nilIfEmpty
                )
            )
            let response: TopicRequestSubmissionResponseDTO = try await send(request)
            confirmation = response.alreadyRequested
                ? "You had already asked for this. Its verdict is below."
                : "Filed. An editor reads it next; the verdict lands here."
            errorMessage = nil
            await load()
            return true
        } catch {
            errorMessage = message(for: error)
            return false
        }
    }

    func clearConfirmation() {
        confirmation = nil
    }

    private func url(for path: [String]) -> URL {
        var url = baseURL
        for component in path { url.appendPathComponent(component) }
        return url
    }

    private func send<Response: Decodable>(_ request: URLRequest) async throws -> Response {
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw CivicRepositoryError.invalidResponse
        }
        guard (200..<300).contains(http.statusCode) else {
            // The server writes these for the reader — a rate limit says how
            // long to wait — so pass it through instead of a status code.
            if let envelope = try? CivicJSON.decoder().decode(CivicErrorDTO.self, from: data) {
                throw TopicRequestError.server(envelope.error)
            }
            throw CivicRepositoryError.httpStatus(http.statusCode)
        }
        return try CivicJSON.decoder().decode(Response.self, from: data)
    }

    private func message(for error: Error) -> String {
        if let known = error as? TopicRequestError { return known.errorDescription ?? "" }
        if error is DecodingError { return "CivicNote could not read the server's reply." }
        return error.localizedDescription
    }
}

enum TopicRequestError: LocalizedError {
    case server(String)

    var errorDescription: String? {
        switch self {
        case .server(let message): message
        }
    }
}

private extension String {
    var trimmed: String { trimmingCharacters(in: .whitespacesAndNewlines) }
    var nilIfEmpty: String? { isEmpty ? nil : self }
}
