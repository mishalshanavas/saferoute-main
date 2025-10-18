package com.saferoute.handlers;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.saferoute.dto.ContributionRequest;
import com.saferoute.models.Contribution;
import com.saferoute.repository.ContributionRepository;

import java.util.HashMap;
import java.util.Map;

public class CreateContributionHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    private final ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
    private final ContributionRepository repo = new ContributionRepository();

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent request, Context context) {
        try {
            ContributionRequest body = mapper.readValue(request.getBody(), ContributionRequest.class);
            if (body.type == null || body.latitude == null || body.longitude == null) {
                return response(400, "Missing required fields: type, latitude, longitude");
            }
            Contribution c = new Contribution();
            c.setType(Contribution.Type.valueOf(body.type));
            c.setCoordinates(new Contribution.Coordinates(body.latitude, body.longitude));
            c.setAddress(body.address);
            c.setDescription(body.description);
            c.setSeverity(body.severity != null ? body.severity : "medium");
            c.setStatus("pending");
            c.setContributorName(body.contributorName);
            c.setContributorEmail(body.contributorEmail);

            Contribution created = repo.create(c);
            return json(201, created);
        } catch (IllegalArgumentException e) {
            return response(400, "Invalid type value");
        } catch (Exception e) {
            return response(500, e.getMessage());
        }
    }

    private APIGatewayProxyResponseEvent response(int statusCode, String message) {
        Map<String, String> body = new HashMap<>();
        body.put("message", message);
        return new APIGatewayProxyResponseEvent()
                .withStatusCode(statusCode)
                .withHeaders(cors())
                .withBody(toJson(body));
    }

    private APIGatewayProxyResponseEvent json(int statusCode, Object obj) {
        return new APIGatewayProxyResponseEvent()
                .withStatusCode(statusCode)
                .withHeaders(cors())
                .withBody(toJson(obj));
    }

    private String toJson(Object obj) {
        try { return mapper.writeValueAsString(obj);} catch (Exception e) {return "{}";}
    }

    private Map<String,String> cors() {
        Map<String, String> h = new HashMap<>();
        h.put("Access-Control-Allow-Origin", "*");
        h.put("Access-Control-Allow-Headers", "Content-Type");
        h.put("Access-Control-Allow-Methods", "OPTIONS,POST,GET");
        return h;
    }
}
