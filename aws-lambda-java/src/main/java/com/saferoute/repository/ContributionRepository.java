package com.saferoute.repository;

import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Sorts;
import com.saferoute.models.Contribution;
import com.saferoute.utils.MongoProvider;
import org.bson.Document;
import org.bson.types.ObjectId;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class ContributionRepository {

    private MongoCollection<Document> collection() {
        return MongoProvider.contributions();
    }

    private Contribution fromDoc(Document d) {
        Contribution c = new Contribution();
        c.setId(d.getObjectId("_id").toHexString());
        c.setType(Contribution.Type.valueOf(d.getString("type")));
        Document coords = d.get("coordinates", Document.class);
        if (coords != null) {
            c.setCoordinates(new Contribution.Coordinates(coords.getDouble("latitude"), coords.getDouble("longitude")));
        }
        c.setAddress(d.getString("address"));
        c.setDescription(d.getString("description"));
        c.setSeverity(d.getString("severity"));
        c.setStatus(d.getString("status"));
        c.setContributorName(d.getString("contributorName"));
        c.setContributorEmail(d.getString("contributorEmail"));
        c.setVerified(Boolean.TRUE.equals(d.getBoolean("verified")));
        if (d.getDate("verifiedAt") != null) c.setVerifiedAt(d.getDate("verifiedAt").toInstant());
        c.setVerifiedBy(d.getString("verifiedBy"));
        Document votes = d.get("votes", Document.class);
        if (votes != null) {
            Contribution.Votes v = new Contribution.Votes();
            v.setUpvotes(votes.getInteger("upvotes", 0));
            v.setDownvotes(votes.getInteger("downvotes", 0));
            c.setVotes(v);
        }
        if (d.getDate("createdAt") != null) c.setCreatedAt(d.getDate("createdAt").toInstant());
        if (d.getDate("updatedAt") != null) c.setUpdatedAt(d.getDate("updatedAt").toInstant());
        return c;
    }

    private Document toDoc(Contribution c) {
        Document d = new Document();
        d.put("type", c.getType().name());
        if (c.getCoordinates() != null) {
            d.put("coordinates", new Document("latitude", c.getCoordinates().getLatitude())
                    .append("longitude", c.getCoordinates().getLongitude()));
        }
        if (c.getAddress() != null) d.put("address", c.getAddress());
        if (c.getDescription() != null) d.put("description", c.getDescription());
        if (c.getSeverity() != null) d.put("severity", c.getSeverity());
        if (c.getStatus() != null) d.put("status", c.getStatus());
        if (c.getContributorName() != null) d.put("contributorName", c.getContributorName());
        if (c.getContributorEmail() != null) d.put("contributorEmail", c.getContributorEmail());
        d.put("verified", c.isVerified());
        if (c.getVerifiedAt() != null) d.put("verifiedAt", java.util.Date.from(c.getVerifiedAt()));
        if (c.getVerifiedBy() != null) d.put("verifiedBy", c.getVerifiedBy());
        Document votes = new Document("upvotes", c.getVotes() != null ? c.getVotes().getUpvotes() : 0)
                .append("downvotes", c.getVotes() != null ? c.getVotes().getDownvotes() : 0);
        d.put("votes", votes);
        d.put("createdAt", java.util.Date.from(c.getCreatedAt() != null ? c.getCreatedAt() : Instant.now()));
        d.put("updatedAt", java.util.Date.from(Instant.now()));
        return d;
    }

    public Contribution create(Contribution input) {
        Document d = toDoc(input);
        collection().insertOne(d);
        input.setId(d.getObjectId("_id").toHexString());
        input.setCreatedAt(((java.util.Date)d.get("createdAt")).toInstant());
        input.setUpdatedAt(((java.util.Date)d.get("updatedAt")).toInstant());
        return input;
    }

    public List<Contribution> findAll() {
        List<Contribution> list = new ArrayList<>();
        FindIterable<Document> cur = collection().find().sort(Sorts.descending("createdAt"));
        for (Document d : cur) list.add(fromDoc(d));
        return list;
    }

    public List<Contribution> findNearby(double latitude, double longitude, double radiusKm) {
        // Simple bounding box approximation for demo. For production use 2dsphere index and $near.
        double kmPerDegLat = 110.574;
        double kmPerDegLon = 111.320 * Math.cos(Math.toRadians(latitude));
        double deltaLat = radiusKm / kmPerDegLat;
        double deltaLon = radiusKm / kmPerDegLon;

        double minLat = latitude - deltaLat;
        double maxLat = latitude + deltaLat;
        double minLon = longitude - deltaLon;
        double maxLon = longitude + deltaLon;

        FindIterable<Document> cur = collection().find(Filters.and(
                Filters.gte("coordinates.latitude", minLat),
                Filters.lte("coordinates.latitude", maxLat),
                Filters.gte("coordinates.longitude", minLon),
                Filters.lte("coordinates.longitude", maxLon)
        )).sort(Sorts.descending("createdAt"));

        List<Contribution> list = new ArrayList<>();
        for (Document d : cur) list.add(fromDoc(d));
        return list;
    }

    public Contribution findById(String id) {
        Document d = collection().find(Filters.eq("_id", new ObjectId(id))).first();
        return d != null ? fromDoc(d) : null;
    }
}
