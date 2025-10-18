# SafeRoute AWS Lambda (Java)

Java-based AWS Lambda functions that mirror the existing Node/Express backend endpoints for contributions.

## Endpoints (via API Gateway)

- POST /contributions -> CreateContributionHandler
- GET /contributions -> GetAllContributionsHandler
- GET /contributions/nearby?latitude=..&longitude=..&radius=.. -> GetNearbyContributionsHandler

## Environment Variables

- MONGODB_URI: MongoDB Atlas connection string
- MONGODB_DB: Database name (default: saferoute)
- MONGODB_COLLECTION: Collection name (default: contributions)

## Build

```bash
mvn -q -f aws-lambda-java/pom.xml -DskipTests package
```

This produces a shaded JAR: `target/aws-lambda-java-1.0.0-shaded.jar`

## Deploy Options

- AWS Console: Create three Lambdas with the shaded JAR and set handlers:
  - com.saferoute.handlers.CreateContributionHandler::handleRequest
  - com.saferoute.handlers.GetAllContributionsHandler::handleRequest
  - com.saferoute.handlers.GetNearbyContributionsHandler::handleRequest
- Or use SAM/CloudFormation (template not included, see Next Steps)

## Notes

- For production geospatial queries, use a 2dsphere index and `$near`. Current implementation uses a bounding-box approximation for simplicity.
- Types must be one of: cctv, no_street_light, abandoned_house, pothole, accident_prone, dark_area, other

## Local test snippets (optional)

Example POST body:
```json
{
  "type": "cctv",
  "latitude": 10.0,
  "longitude": 76.0,
  "address": "Somewhere",
  "description": "Camera near junction",
  "severity": "high",
  "contributorName": "Alice",
  "contributorEmail": "alice@example.com"
}
```
