package com.saferoute.handlers;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.saferoute.models.Contribution;
import com.saferoute.repository.ContributionRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class GetAllContributionsHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    private final ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
    private final ContributionRepository repo = new ContributionRepository();

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent request, Context context) {
        try {
            List<Contribution> list = repo.findAll();
            String body = mapper.writeValueAsString(list);
            return new APIGatewayProxyResponseEvent()
                    .withStatusCode(200)
                    .withHeaders(cors())
                    .withBody(body);
        } catch (Exception e) {
            return new APIGatewayProxyResponseEvent()
                    .withStatusCode(500)
                    .withHeaders(cors())
                    .withBody("{\"message\":\"" + e.getMessage() + "\"}");
        }
    }

    private Map<String,String> cors() {
        Map<String, String> h = new HashMap<>();
        h.put("Access-Control-Allow-Origin", "*");
        h.put("Access-Control-Allow-Headers", "Content-Type");
        h.put("Access-Control-Allow-Methods", "OPTIONS,POST,GET");
        return h;
    }
}
