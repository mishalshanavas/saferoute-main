package com.saferoute.models;

import java.time.Instant;
import java.util.Objects;

public class Contribution {
    public enum Type {
        cctv, no_street_light, abandoned_house, pothole, accident_prone, dark_area, other
    }

    public static class Coordinates {
        private double latitude;
        private double longitude;

        public Coordinates() {}
        public Coordinates(double latitude, double longitude) {
            this.latitude = latitude;
            this.longitude = longitude;
        }
        public double getLatitude() {return latitude;}
        public void setLatitude(double latitude) {this.latitude = latitude;}
        public double getLongitude() {return longitude;}
        public void setLongitude(double longitude) {this.longitude = longitude;}
    }

    public static class Votes {
        private int upvotes;
        private int downvotes;

        public int getUpvotes() {return upvotes;}
        public void setUpvotes(int upvotes) {this.upvotes = upvotes;}
        public int getDownvotes() {return downvotes;}
        public void setDownvotes(int downvotes) {this.downvotes = downvotes;}
    }

    private String id; // _id
    private Type type;
    private Coordinates coordinates;
    private String address;
    private String description;
    private String severity; // low, medium, high
    private String status; // pending, verified, rejected
    private String contributorName;
    private String contributorEmail;
    private boolean verified;
    private Instant verifiedAt;
    private String verifiedBy;
    private Votes votes = new Votes();
    private Instant createdAt;
    private Instant updatedAt;

    public String getId() {return id;}
    public void setId(String id) {this.id = id;}
    public Type getType() {return type;}
    public void setType(Type type) {this.type = type;}
    public Coordinates getCoordinates() {return coordinates;}
    public void setCoordinates(Coordinates coordinates) {this.coordinates = coordinates;}
    public String getAddress() {return address;}
    public void setAddress(String address) {this.address = address;}
    public String getDescription() {return description;}
    public void setDescription(String description) {this.description = description;}
    public String getSeverity() {return severity;}
    public void setSeverity(String severity) {this.severity = severity;}
    public String getStatus() {return status;}
    public void setStatus(String status) {this.status = status;}
    public String getContributorName() {return contributorName;}
    public void setContributorName(String contributorName) {this.contributorName = contributorName;}
    public String getContributorEmail() {return contributorEmail;}
    public void setContributorEmail(String contributorEmail) {this.contributorEmail = contributorEmail;}
    public boolean isVerified() {return verified;}
    public void setVerified(boolean verified) {this.verified = verified;}
    public Instant getVerifiedAt() {return verifiedAt;}
    public void setVerifiedAt(Instant verifiedAt) {this.verifiedAt = verifiedAt;}
    public String getVerifiedBy() {return verifiedBy;}
    public void setVerifiedBy(String verifiedBy) {this.verifiedBy = verifiedBy;}
    public Votes getVotes() {return votes;}
    public void setVotes(Votes votes) {this.votes = votes;}
    public Instant getCreatedAt() {return createdAt;}
    public void setCreatedAt(Instant createdAt) {this.createdAt = createdAt;}
    public Instant getUpdatedAt() {return updatedAt;}
    public void setUpdatedAt(Instant updatedAt) {this.updatedAt = updatedAt;}

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Contribution)) return false;
        Contribution that = (Contribution) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {return Objects.hash(id);}    
}