import Foundation

struct CivicDeepLink: Equatable, Sendable {
    let eventKey: String
}

enum DeepLinkRouter {
    static func route(url: URL) -> CivicDeepLink? {
        if url.scheme?.lowercased() == "civicnote" {
            let components = [url.host].compactMap { $0 } + url.pathComponents.filter { $0 != "/" }
            guard components.count >= 2, components[0].lowercased() == "alerts" else { return nil }
            return validRoute(key: components[1])
        }
        if url.scheme?.lowercased() == "https" {
            let components = url.pathComponents.filter { $0 != "/" }
            guard components.count >= 2, components[0].lowercased() == "alerts" else { return nil }
            return validRoute(key: components[1])
        }
        return nil
    }

    static func route(payload: [AnyHashable: Any]) -> CivicDeepLink? {
        if let eventKey = payload["eventKey"] as? String, let route = validRoute(key: eventKey) {
            return route
        }
        if let path = payload["path"] as? String {
            let components = path.split(separator: "/").map(String.init)
            if components.count >= 2, components[0].lowercased() == "alerts",
               let route = validRoute(key: components[1]) {
                return route
            }
        }
        if let value = payload["url"] as? String,
           let url = URL(string: value),
           let route = route(url: url) {
            return route
        }
        return nil
    }

    private static func validRoute(key: String) -> CivicDeepLink? {
        let decoded = key.removingPercentEncoding ?? key
        let allowed = CharacterSet.alphanumerics.union(CharacterSet(charactersIn: "-_"))
        guard !decoded.isEmpty, decoded.unicodeScalars.allSatisfy(allowed.contains) else { return nil }
        return CivicDeepLink(eventKey: decoded)
    }
}
