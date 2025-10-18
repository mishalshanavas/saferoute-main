package com.saferoute.utils;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;

public class MongoProvider {
    private static MongoClient mongoClient;

    public static synchronized MongoClient getClient() {
        if (mongoClient == null) {
            String uri = System.getenv("MONGODB_URI");
            if (uri == null || uri.isEmpty()) {
                throw new IllegalStateException("MONGODB_URI env var is required");
            }
            ConnectionString cs = new ConnectionString(uri);
            MongoClientSettings settings = MongoClientSettings.builder()
                    .applyConnectionString(cs)
                    .build();
            mongoClient = MongoClients.create(settings);
        }
        return mongoClient;
    }

    public static MongoDatabase db() {
        String dbName = System.getenv("MONGODB_DB");
        if (dbName == null || dbName.isEmpty()) dbName = "saferoute";
        return getClient().getDatabase(dbName);
    }

    public static MongoCollection<Document> contributions() {
        String col = System.getenv("MONGODB_COLLECTION");
        if (col == null || col.isEmpty()) col = "contributions";
        return db().getCollection(col);
    }
}
